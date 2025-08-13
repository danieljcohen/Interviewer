const AWS = require('aws-sdk');
const sqs = new AWS.SQS();

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    // Parse the request body
    const body = JSON.parse(event.body);
    const { code, input, expectedOutput, language = 'typescript' } = body;
    
    // Validate required fields
    if (!code || !input || !expectedOutput) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
          'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        body: JSON.stringify({
          error: 'Missing required fields: code, input, and expectedOutput are required'
        })
      };
    }
    
    // Generate a unique job ID
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create the job message
    const jobMessage = {
      jobId,
      code,
      input,
      expectedOutput,
      language,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };
    
    // Send message to SQS
    const params = {
      QueueUrl: process.env.QUEUE_URL,
      MessageBody: JSON.stringify(jobMessage),
      MessageAttributes: {
        'JobId': {
          DataType: 'String',
          StringValue: jobId
        },
        'Language': {
          DataType: 'String',
          StringValue: language
        }
      }
    };
    
    console.log('Sending message to SQS:', JSON.stringify(params, null, 2));
    
    const result = await sqs.sendMessage(params).promise();
    
    console.log('Message sent successfully:', JSON.stringify(result, null, 2));
    
    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        jobId,
        messageId: result.MessageId,
        message: 'Job submitted successfully'
      })
    };
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
}; 