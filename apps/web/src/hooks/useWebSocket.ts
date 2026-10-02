import { useEffect, useRef, useState, useCallback } from 'react';
import { SmartEvent, Situation } from '../types';

export interface WebSocketState {
  isConnected: boolean;
  lastEvent: SmartEvent | null;
  lastSituation: Situation | null;
  homeState: string | null;
}

export function useWebSocket(onEvent?: (event: SmartEvent) => void, onSituation?: (situation: Situation) => void) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<SmartEvent | null>(null);
  const [lastSituation, setLastSituation] = useState<Situation | null>(null);
  const [homeState, setHomeState] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      // Connect to proxy /ws/events or direct
      const wsUrl = `${protocol}//${host}/ws/events`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (messageEvent) => {
        try {
          const data = JSON.parse(messageEvent.data);
          if (data.type === 'new_event') {
            setLastEvent(data.event);
            if (onEvent) onEvent(data.event);
          } else if (data.type === 'situation_detected') {
            setLastSituation(data.situation);
            if (onSituation) onSituation(data.situation);
          } else if (data.type === 'home_state_changed') {
            setHomeState(data.state);
          }
        } catch (err) {
          console.error('[WebSocket] Parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('[WebSocket] Connection failure:', e);
    }
  }, [onEvent, onSituation]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return { isConnected, lastEvent, lastSituation, homeState };
}
