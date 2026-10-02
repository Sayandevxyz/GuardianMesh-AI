from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime, timedelta
import math
from app.config import settings

class SituationEngine:
    """
    Deterministic Smart-Home Event Correlation and Situation Intelligence Engine.
    Transforms fragmented streams of raw telemetry into structured, contextual Situations.
    """

    def __init__(self):
        self.time_window_seconds = settings.CORRELATION_WINDOW_SECONDS
        self.presence_threshold = settings.EXTENDED_PRESENCE_THRESHOLD_SECONDS

    def correlate_events(
        self,
        recent_events: List[Dict[str, Any]],
        home_state: str = "away",
        current_time: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Main correlation pipeline:
        1. Temporal window filtering
        2. Spatial clustering (location grouping)
        3. Event sequence analysis & feature extraction
        4. Deterministic situation classification & scoring
        5. Situation Graph construction
        """
        if not recent_events:
            return []

        if not current_time:
            current_time = datetime.utcnow()

        # Step 1 & 2: Filter by temporal window and group by location
        valid_events = []
        for e in recent_events:
            evt_time = self._parse_timestamp(e.get("timestamp"))
            if evt_time and (current_time - evt_time).total_seconds() <= self.time_window_seconds:
                valid_events.append({**e, "_parsed_time": evt_time})

        if not valid_events:
            # If all are outside current window, take the last N events for analysis
            for e in recent_events[-6:]:
                evt_time = self._parse_timestamp(e.get("timestamp")) or current_time
                valid_events.append({**e, "_parsed_time": evt_time})

        # Sort chronologically
        valid_events.sort(key=lambda x: x["_parsed_time"])

        # Group by location
        location_clusters: Dict[str, List[Dict[str, Any]]] = {}
        for evt in valid_events:
            loc = evt.get("location", "front_door")
            location_clusters.setdefault(loc, []).append(evt)

        detected_situations = []

        for location, cluster in location_clusters.items():
            situation = self._evaluate_cluster(cluster, location, home_state, current_time)
            if situation:
                detected_situations.append(situation)

        return detected_situations

    def _evaluate_cluster(
        self,
        cluster: List[Dict[str, Any]],
        location: str,
        home_state: str,
        current_time: datetime
    ) -> Optional[Dict[str, Any]]:
        """
        Evaluates a cluster of correlated events occurring in the same zone within the temporal window.
        """
        event_types = [e.get("eventType") for e in cluster]
        devices = list({e.get("deviceId") for e in cluster if e.get("deviceId")})
        
        # Calculate time span of presence in seconds
        t_start = cluster[0]["_parsed_time"]
        t_end = cluster[-1]["_parsed_time"]
        duration_seconds = max(int((t_end - t_start).total_seconds()), 12)
        
        # Metadata aggregated duration if available
        meta_durations = [e.get("metadata", {}).get("duration", 0) for e in cluster]
        if any(meta_durations):
            duration_seconds = max(duration_seconds, sum(meta_durations))

        # Check for device offline scenario
        if "device_offline" in event_types:
            return self._build_device_offline_situation(cluster, location, devices)

        # Feature flags
        has_person = "person_detected" in event_types
        has_motion = "motion_detected" in event_types
        has_repeated_motion = event_types.count("motion_detected") >= 2 or event_types.count("person_detected") >= 2
        has_package_delivered = "package_detected" in event_types
        has_package_removed = "package_removed" in event_types
        has_door_opened = "door_opened" in event_types
        has_person_left = "person_left" in event_types
        
        # Time of day feature (10 PM to 5 AM)
        hour = t_start.hour
        is_late_night = hour >= 22 or hour < 5

        # Classify Situation based on deterministic logic:

        # Scenario 1: Package theft or tampering
        if has_package_removed and not has_door_opened and home_state in ["away", "sleep"]:
            return self._build_package_theft_situation(
                cluster, location, duration_seconds, home_state, is_late_night
            )

        # Scenario 2: Normal package delivery
        # Person + package detected + short duration (under 60s) + person leaves
        if has_package_delivered and (duration_seconds < 75 or has_person_left):
            return self._build_package_delivery_situation(
                cluster, location, duration_seconds, home_state
            )

        # Scenario 3: Visitor arrival (Resident is Home or door opened)
        if has_person and (home_state in ["home", "guest"] or has_door_opened):
            return self._build_visitor_arrival_situation(
                cluster, location, duration_seconds, home_state, has_door_opened
            )

        # Scenario 4: Suspicious / Unusual entrance activity
        # Person detected, extended presence (>45s), repeated movements, home is unoccupied
        if has_person and (duration_seconds >= self.presence_threshold or has_repeated_motion):
            return self._build_unusual_entrance_situation(
                cluster, location, duration_seconds, home_state, is_late_night, has_repeated_motion
            )

        # Scenario 5: Single isolated motion / False alarm filter (noise reduction)
        if has_motion and not has_person and duration_seconds < 15 and len(cluster) == 1:
            return self._build_false_alarm_situation(cluster, location, duration_seconds)

        # Scenario 6: Late night perimeter motion
        if is_late_night and (has_motion or has_person):
            return self._build_late_night_situation(
                cluster, location, duration_seconds, home_state, has_person
            )

        # Fallback: Correlated general activity
        return self._build_general_activity_situation(
            cluster, location, duration_seconds, home_state, has_person
        )

    def _build_unusual_entrance_situation(
        self,
        cluster: List[Dict[str, Any]],
        location: str,
        duration: int,
        home_state: str,
        is_late_night: bool,
        repeated_movement: bool
    ) -> Dict[str, Any]:
        factors = []
        confidence = 0.0

        # Factor 1: Person Detected
        factors.append({
            "factor": "Person Detected at Perimeter",
            "weight": settings.WEIGHT_PERSON_DETECTED,
            "category": "detection",
            "description": "High-confidence biometric person classification triggered."
        })
        confidence += settings.WEIGHT_PERSON_DETECTED

        # Factor 2: Extended Presence
        if duration >= 45:
            presence_factor = min(settings.WEIGHT_LONG_PRESENCE, 0.15 + (duration / 200.0) * 0.10)
            factors.append({
                "factor": f"Extended Presence ({duration}s)",
                "weight": round(presence_factor, 2),
                "category": "temporal",
                "description": f"Subject lingered near {location.replace('_', ' ')} exceeding the 45-second baseline."
            })
            confidence += presence_factor

        # Factor 3: Repeated Movement
        if repeated_movement:
            factors.append({
                "factor": "Repeated Movement Patterns",
                "weight": settings.WEIGHT_REPEATED_MOVEMENT,
                "category": "behavioral",
                "description": "Sequential telemetry triggers indicating loitering or inspection."
            })
            confidence += settings.WEIGHT_REPEATED_MOVEMENT

        # Factor 4: Home Unoccupied
        if home_state == "away":
            factors.append({
                "factor": "Home State: Away (Unoccupied)",
                "weight": settings.WEIGHT_HOME_UNOCCUPIED,
                "category": "context",
                "description": "Premises marked unoccupied; unexpected visitor presence escalated."
            })
            confidence += settings.WEIGHT_HOME_UNOCCUPIED
        elif home_state == "sleep":
            factors.append({
                "factor": "Home State: Sleep Mode",
                "weight": 0.15,
                "category": "context",
                "description": "Occupants sleeping; heightened vigilance perimeter threshold."
            })
            confidence += 0.15

        # Factor 5: Late Night Context
        if is_late_night:
            factors.append({
                "factor": "Late-Night Time Window",
                "weight": settings.WEIGHT_LATE_NIGHT,
                "category": "environmental",
                "description": "Activity occurred outside standard daytime visitor hours."
            })
            confidence += settings.WEIGHT_LATE_NIGHT

        # Factor 6: Multi-event Correlation
        if len(cluster) >= 3:
            factors.append({
                "factor": f"Multi-Event Sensor Fusion ({len(cluster)} events)",
                "weight": settings.WEIGHT_MULTIPLE_EVENTS,
                "category": "correlation",
                "description": f"{len(cluster)} distinct events temporally linked into a unified situation."
            })
            confidence += settings.WEIGHT_MULTIPLE_EVENTS

        # Clamping and mapping
        final_confidence = min(round(confidence, 2), 0.98)
        severity = self._map_severity(final_confidence)

        summary = (
            f"An individual remained near the {location.replace('_', ' ')} for approximately "
            f"{duration} seconds while the home was {home_state}."
        )
        reasoning = (
            f"The alert was triggered by {len(cluster)} correlated events: "
            f"person detection followed by sustained dwell time ({duration}s) and repeated movement."
        )
        recommended_action = "Review the incident timeline, check live feed, or speak through the intercom."

        graph = self._construct_graph(cluster, "unusual_entrance_activity", "Unusual Entrance Activity", location, home_state)

        return {
            "title": "Unusual Entrance Activity",
            "situation_type": "unusual_entrance_activity",
            "severity": severity,
            "confidence": final_confidence,
            "location": location,
            "duration_seconds": duration,
            "summary": summary,
            "reasoning": reasoning,
            "recommended_action": recommended_action,
            "contributing_factors": factors,
            "graph_data": graph,
            "events": cluster
        }

    def _build_package_delivery_situation(
        self,
        cluster: List[Dict[str, Any]],
        location: str,
        duration: int,
        home_state: str
    ) -> Dict[str, Any]:
        factors = [
            {"factor": "Package Detected", "weight": 0.40, "category": "object", "description": "Delivery package identified by camera classifier."},
            {"factor": "Transit Delivery Flow", "weight": 0.35, "category": "behavioral", "description": f"Courier completed delivery within {duration}s standard window."},
            {"factor": "Contextual Normalcy", "weight": 0.15, "category": "context", "description": "Standard arrival and departure pattern."}
        ]
        confidence = 0.94
        graph = self._construct_graph(cluster, "normal_package_delivery", "Normal Package Delivery", location, home_state)
        return {
            "title": "Package Delivery Verified",
            "situation_type": "normal_package_delivery",
            "severity": "info",
            "confidence": confidence,
            "location": location,
            "duration_seconds": duration,
            "summary": f"A package was delivered and verified at {location.replace('_', ' ')}. Courier departed promptly.",
            "reasoning": "Temporal pattern matches courier drop-off behavior: arrival, placement, and departure under 60 seconds.",
            "recommended_action": "Retrieve package at your convenience.",
            "contributing_factors": factors,
            "graph_data": graph,
            "events": cluster
        }

    def _build_visitor_arrival_situation(
        self,
        cluster: List[Dict[str, Any]],
        location: str,
        duration: int,
        home_state: str,
        door_opened: bool
    ) -> Dict[str, Any]:
        factors = [
            {"factor": "Visitor Detected", "weight": 0.30, "category": "detection", "description": "Person arrived at entrance."},
            {"factor": f"Home State: {home_state.capitalize()}", "weight": 0.35, "category": "context", "description": "Residents are present to receive guests."},
        ]
        if door_opened:
            factors.append({"factor": "Entrance Opened", "weight": 0.30, "category": "behavioral", "description": "Door opened by resident acknowledging visitor."})
        
        graph = self._construct_graph(cluster, "visitor_arrival", "Visitor Arrival", location, home_state)
        return {
            "title": "Visitor Arrival",
            "situation_type": "visitor_arrival",
            "severity": "low",
            "confidence": 0.88,
            "location": location,
            "duration_seconds": duration,
            "summary": f"A guest or resident was greeted at the {location.replace('_', ' ')}.",
            "reasoning": "Correlated visitor presence with occupied home state and entrance access.",
            "recommended_action": "No action needed. Visitor accounted for.",
            "contributing_factors": factors,
            "graph_data": graph,
            "events": cluster
        }

    def _build_package_theft_situation(
        self,
        cluster: List[Dict[str, Any]],
        location: str,
        duration: int,
        home_state: str,
        is_late_night: bool
    ) -> Dict[str, Any]:
        factors = [
            {"factor": "Package Removed", "weight": 0.35, "category": "object", "description": "Delivered package removed from doorstep."},
            {"factor": "No Resident Access", "weight": 0.30, "category": "security", "description": "No door unlock or resident presence recorded."},
            {"factor": "Unoccupied Home", "weight": 0.25, "category": "context", "description": "Home state is Away during package retrieval."}
        ]
        confidence = 0.91
        graph = self._construct_graph(cluster, "package_theft_risk", "Package Removal Risk", location, home_state)
        return {
            "title": "Potential Package Tampering",
            "situation_type": "package_theft_risk",
            "severity": "high",
            "confidence": confidence,
            "location": location,
            "duration_seconds": duration,
            "summary": f"Package removed from {location.replace('_', ' ')} while home state was marked {home_state}.",
            "reasoning": "Package removal detected without subsequent door open or resident authentication event.",
            "recommended_action": "Verify package retrieval with family members or check recorded footage.",
            "contributing_factors": factors,
            "graph_data": graph,
            "events": cluster
        }

    def _build_late_night_situation(
        self,
        cluster: List[Dict[str, Any]],
        location: str,
        duration: int,
        home_state: str,
        has_person: bool
    ) -> Dict[str, Any]:
        factors = [
            {"factor": "Late-Night Perimeter Activity", "weight": 0.40, "category": "temporal", "description": "Movement detected during curfew hours (10 PM - 5 AM)."},
            {"factor": "Subject Identified" if has_person else "Motion Tripped", "weight": 0.30, "category": "detection", "description": "Sensor tripped at perimeter."}
        ]
        confidence = 0.82 if has_person else 0.65
        severity = "medium" if has_person else "low"
        graph = self._construct_graph(cluster, "late_night_activity", "Late Night Activity", location, home_state)
        return {
            "title": "Late Night Perimeter Activity",
            "situation_type": "late_night_activity",
            "severity": severity,
            "confidence": confidence,
            "location": location,
            "duration_seconds": duration,
            "summary": f"Movement detected in {location.replace('_', ' ')} at late hours.",
            "reasoning": "Sensors activated outside daylight hours; verified against sleep/away profile.",
            "recommended_action": "Check exterior floodlight and camera recording.",
            "contributing_factors": factors,
            "graph_data": graph,
            "events": cluster
        }

    def _build_device_offline_situation(
        self,
        cluster: List[Dict[str, Any]],
        location: str,
        devices: List[str]
    ) -> Dict[str, Any]:
        device_id = devices[0] if devices else "smart-device"
        factors = [
            {"factor": "Telemetry Heartbeat Missed", "weight": 0.50, "category": "infrastructure", "description": "Device stopped responding to mesh ping."},
            {"factor": "Zero Signal / Power Loss", "weight": 0.40, "category": "network", "description": "Wi-Fi link dropped or power interrupted."}
        ]
        graph = self._construct_graph(cluster, "device_offline", "Device Connectivity Lost", location, "unknown")
        return {
            "title": f"Device Offline ({device_id})",
            "situation_type": "device_offline",
            "severity": "medium",
            "confidence": 0.99,
            "location": location,
            "duration_seconds": 60,
            "summary": f"Device {device_id} in {location.replace('_', ' ')} went offline.",
            "reasoning": "Mesh heartbeat failed to receive acknowledgement ping.",
            "recommended_action": "Check device power, Wi-Fi access point, and battery level.",
            "contributing_factors": factors,
            "graph_data": graph,
            "events": cluster
        }

    def _build_false_alarm_situation(
        self,
        cluster: List[Dict[str, Any]],
        location: str,
        duration: int
    ) -> Dict[str, Any]:
        factors = [
            {"factor": "Isolated Transient Motion", "weight": 0.60, "category": "noise_reduction", "description": "Single momentary trigger without person or object detection."},
            {"factor": "Duration Under 15s", "weight": 0.35, "category": "temporal", "description": "Brief motion spike indicative of wind, foliage, or small animal."}
        ]
        graph = self._construct_graph(cluster, "false_alarm", "Transient Motion (Filtered)", location, "home")
        return {
            "title": "Transient Motion (False Alarm Filtered)",
            "situation_type": "false_alarm",
            "severity": "info",
            "confidence": 0.28,
            "location": location,
            "duration_seconds": duration,
            "summary": f"Transient motion in {location.replace('_', ' ')} filtered as non-security event.",
            "reasoning": "Deterministic noise reduction suppressed notification due to lack of subsequent biometric presence.",
            "recommended_action": "No action required. GuardianMesh suppressed notification.",
            "contributing_factors": factors,
            "graph_data": graph,
            "events": cluster
        }

    def _build_general_activity_situation(
        self,
        cluster: List[Dict[str, Any]],
        location: str,
        duration: int,
        home_state: str,
        has_person: bool
    ) -> Dict[str, Any]:
        factors = [
            {"factor": "Cluster of Sensor Triggers", "weight": 0.40, "category": "correlation", "description": f"{len(cluster)} events recorded in zone."},
            {"factor": f"Location: {location}", "weight": 0.30, "category": "spatial", "description": "Zone monitored."}
        ]
        confidence = 0.50 if has_person else 0.35
        graph = self._construct_graph(cluster, "correlated_activity", "Correlated Activity", location, home_state)
        return {
            "title": "Correlated Zone Activity",
            "situation_type": "correlated_activity",
            "severity": "low",
            "confidence": confidence,
            "location": location,
            "duration_seconds": duration,
            "summary": f"Correlated activity detected around {location.replace('_', ' ')}.",
            "reasoning": f"Grouped {len(cluster)} telemetry readings within {self.time_window_seconds}s window.",
            "recommended_action": "Review event log if desired.",
            "contributing_factors": factors,
            "graph_data": graph,
            "events": cluster
        }

    def _construct_graph(
        self,
        cluster: List[Dict[str, Any]],
        sit_type: str,
        sit_title: str,
        location: str,
        home_state: str
    ) -> Dict[str, Any]:
        """
        Constructs the interactive Situation Graph:
        Nodes: events, devices, locations, people, situations
        Edges: caused_by, followed_by, occurred_near, correlated_with, escalated_to
        """
        nodes = []
        edges = []

        # 1. Situation Node (Center/Top)
        sit_node_id = f"node_sit_{sit_type}"
        nodes.append({
            "id": sit_node_id,
            "label": sit_title,
            "type": "situation",
            "status": "active",
            "metadata": {"type": sit_type, "severity": "medium"}
        })

        # 2. Location Node
        loc_node_id = f"node_loc_{location}"
        nodes.append({
            "id": loc_node_id,
            "label": location.replace("_", " ").title(),
            "type": "location",
            "status": "monitored",
            "metadata": {"zone": location}
        })
        edges.append({
            "id": f"edge_loc_sit",
            "source": loc_node_id,
            "target": sit_node_id,
            "label": "occurred_near",
            "animated": True
        })

        # 3. Home State Node
        state_node_id = f"node_state_{home_state}"
        nodes.append({
            "id": state_node_id,
            "label": f"State: {home_state.capitalize()}",
            "type": "home_state",
            "status": "context",
            "metadata": {"state": home_state}
        })
        edges.append({
            "id": f"edge_state_sit",
            "source": state_node_id,
            "target": sit_node_id,
            "label": "correlated_with",
            "animated": False
        })

        # 4. Device Nodes & Event Nodes
        prev_evt_node_id = None
        device_ids_seen = set()

        for idx, evt in enumerate(cluster):
            evt_id = evt.get("id", f"e_{idx}")
            evt_type = evt.get("eventType", "event")
            dev_id = evt.get("deviceId", "device-01")

            # Add device node if not present
            dev_node_id = f"node_dev_{dev_id}"
            if dev_id not in device_ids_seen:
                device_ids_seen.add(dev_id)
                nodes.append({
                    "id": dev_node_id,
                    "label": dev_id.replace("-", " ").title(),
                    "type": "device",
                    "status": "online",
                    "metadata": {"deviceType": evt.get("deviceType", "sensor")}
                })
                # Device occurred_near Location
                edges.append({
                    "id": f"edge_{dev_id}_{loc_node_id}",
                    "source": dev_node_id,
                    "target": loc_node_id,
                    "label": "located_at",
                    "animated": False
                })

            # Add event node
            evt_node_id = f"node_evt_{evt_id}"
            nodes.append({
                "id": evt_node_id,
                "label": evt_type.replace("_", " ").title(),
                "type": "event",
                "status": "detected",
                "metadata": {
                    "timestamp": str(evt.get("timestamp")),
                    "confidence": evt.get("confidence", 0.95),
                    "eventType": evt_type
                }
            })

            # Device generated Event
            edges.append({
                "id": f"edge_{dev_id}_{evt_node_id}",
                "source": dev_node_id,
                "target": evt_node_id,
                "label": "caused_by",
                "animated": True
            })

            # Event temporal chaining
            if prev_evt_node_id:
                edges.append({
                    "id": f"edge_{prev_evt_node_id}_{evt_node_id}",
                    "source": prev_evt_node_id,
                    "target": evt_node_id,
                    "label": "followed_by",
                    "animated": True
                })
            prev_evt_node_id = evt_node_id

            # Connect event to situation
            edges.append({
                "id": f"edge_{evt_node_id}_{sit_node_id}",
                "source": evt_node_id,
                "target": sit_node_id,
                "label": "escalated_to" if idx == len(cluster) - 1 else "correlated_with",
                "animated": True
            })

        return {"nodes": nodes, "edges": edges}

    def _map_severity(self, confidence: float) -> str:
        """
        Maps confidence score to severity level:
        0.00 - 0.30: INFO
        0.30 - 0.55: LOW
        0.55 - 0.75: MEDIUM
        0.75 - 0.90: HIGH
        0.90+: CRITICAL
        """
        if confidence < 0.30:
            return "info"
        elif confidence < 0.55:
            return "low"
        elif confidence < 0.75:
            return "medium"
        elif confidence < 0.90:
            return "high"
        else:
            return "critical"

    def _parse_timestamp(self, ts) -> Optional[datetime]:
        if not ts:
            return None
        if isinstance(ts, datetime):
            return ts
        try:
            return datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        except Exception:
            return None
