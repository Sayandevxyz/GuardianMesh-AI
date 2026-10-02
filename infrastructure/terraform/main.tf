terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  default = "us-east-1"
}

# 1. Amazon EventBridge Bus for Real-time Smart-Home Telemetry
resource "aws_cloudwatch_event_bus" "guardianmesh_bus" {
  name = "guardianmesh-telemetry-bus"
}

# 2. Amazon DynamoDB Table for Event Sourcing & Situation Cache
resource "aws_dynamodb_table" "situations_table" {
  name         = "guardianmesh-situations"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "home_id"
  range_key    = "situation_id"

  attribute {
    name = "home_id"
    type = "S"
  }

  attribute {
    name = "situation_id"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Project     = "GuardianMesh AI"
    Environment = "Production"
  }
}

# 3. Amazon S3 Bucket for Incident Reports & Audit Evidence
resource "aws_s3_bucket" "audit_bucket" {
  bucket        = "guardianmesh-incident-reports"
  force_destroy = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit_encryption" {
  bucket = aws_s3_bucket.audit_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 4. Amazon CloudWatch Log Group for Agent Tracing & Cost Observability
resource "aws_cloudwatch_log_group" "agent_logs" {
  name              = "/aws/guardianmesh/agent-reasoning"
  retention_in_days = 30
}

# 5. IAM Role for Bedrock Foundation Model Access (Claude 3.5 Sonnet & Nova)
resource "aws_iam_role" "bedrock_execution_role" {
  name = "guardianmesh-bedrock-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = ["ecs-tasks.amazonaws.com", "lambda.amazonaws.com"]
        }
      }
    ]
  })
}

resource "aws_iam_policy" "bedrock_access" {
  name = "guardianmesh-bedrock-access-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:Converse",
          "bedrock:ConverseStream"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "attach_bedrock" {
  role       = aws_iam_role.bedrock_execution_role.name
  policy_arn = aws_iam_policy.bedrock_access.arn
}
