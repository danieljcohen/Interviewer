import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';

export class InterviewerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create SQS Queue for job processing
    const jobQueue = new sqs.Queue(this, 'JobQueue', {
      queueName: 'interviewer-job-queue',
      visibilityTimeout: cdk.Duration.seconds(300), // 5 minutes
      retentionPeriod: cdk.Duration.days(14),
      deadLetterQueue: {
        queue: new sqs.Queue(this, 'JobDLQ', {
          queueName: 'interviewer-job-dlq',
          retentionPeriod: cdk.Duration.days(14),
        }),
        maxReceiveCount: 3,
      },
    });

    // Create Lambda function for job submission
    const submitJobLambda = new lambda.Function(this, 'SubmitJobFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/submit-job'),
      functionName: 'interviewer-submit-job',
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment: {
        QUEUE_URL: jobQueue.queueUrl,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
    });

    // Grant Lambda permission to send messages to SQS
    jobQueue.grantSendMessages(submitJobLambda);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'InterviewerAPI', {
      restApiName: 'Interviewer Test Runner API',
      description: 'API for submitting test jobs to the Interviewer system',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // Create API Gateway integration
    const submitJobIntegration = new apigateway.LambdaIntegration(submitJobLambda, {
      requestTemplates: {
        'application/json': JSON.stringify({
          body: '$input.body',
          headers: '$input.params().header',
        }),
      },
    });

    // Add POST endpoint for job submission
    const jobs = api.root.addResource('jobs');
    jobs.addMethod('POST', submitJobIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
      requestValidator: new apigateway.RequestValidator(this, 'SubmitJobValidator', {
        restApi: api,
        validateRequestBody: true,
        validateRequestParameters: false,
      }),
      requestModels: {
        'application/json': new apigateway.Model(this, 'SubmitJobModel', {
          restApi: api,
          contentType: 'application/json',
          modelName: 'SubmitJobModel',
          schema: {
            type: apigateway.JsonSchemaType.OBJECT,
            required: ['code', 'input', 'expectedOutput'],
            properties: {
              code: {
                type: apigateway.JsonSchemaType.STRING,
                description: 'The code to test',
              },
              input: {
                type: apigateway.JsonSchemaType.STRING,
                description: 'Test input',
              },
              expectedOutput: {
                type: apigateway.JsonSchemaType.STRING,
                description: 'Expected output',
              },
              language: {
                type: apigateway.JsonSchemaType.STRING,
                description: 'Programming language (default: typescript)',
                enum: ['typescript', 'javascript', 'python', 'java'],
              },
            },
          },
        }),
      },
    });

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL for job submission',
      exportName: 'InterviewerApiGatewayUrl',
    });

    // Output the SQS Queue URL
    new cdk.CfnOutput(this, 'JobQueueUrl', {
      value: jobQueue.queueUrl,
      description: 'SQS Queue URL for job processing',
      exportName: 'InterviewerJobQueueUrl',
    });
  }
} 