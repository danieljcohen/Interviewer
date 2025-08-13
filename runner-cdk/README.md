# Interviewer AWS Infrastructure

This directory contains the AWS CDK infrastructure for the Interviewer test runner system.

## Architecture

- **API Gateway**: Receives HTTP requests for job submission
- **Lambda Function**: Processes job submissions and sends them to SQS
- **SQS Queue**: Stores jobs for processing with dead letter queue for failed jobs

## Prerequisites

1. AWS CLI installed and configured
2. Node.js 18+ installed
3. AWS CDK CLI installed: `npm install -g aws-cdk`

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Lambda dependencies:**
   ```bash
   cd lambda/submit-job
   npm install
   cd ../..
   ```

3. **Bootstrap CDK (first time only):**
   ```bash
   cdk bootstrap
   ```

4. **Deploy the infrastructure:**
   ```bash
   cdk deploy
   ```

5. **Get the API Gateway URL:**
   After deployment, the API Gateway URL will be displayed in the output. You can also find it in the AWS Console.

## API Usage

### Submit a Job

**Endpoint:** `POST /jobs`

**Request Body:**
```json
{
  "code": "export const add = (a: number, b: number) => a + b;",
  "input": "2\n3",
  "expectedOutput": "5",
  "language": "typescript"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job_1234567890_abc123def",
  "messageId": "msg-12345678-1234-1234-1234-123456789012",
  "message": "Job submitted successfully"
}
```

## Cleanup

To remove all resources:
```bash
cdk destroy
```

## Next Steps

1. Create a job processor Lambda function that reads from the SQS queue
2. Set up a test execution environment (ECS, Lambda, or EC2)
3. Add job status tracking and results storage
4. Implement job result retrieval API endpoints 