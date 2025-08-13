#!/bin/bash

# Interviewer AWS Infrastructure Deployment Script

set -e

echo "🚀 Starting Interviewer AWS Infrastructure Deployment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "❌ AWS CDK is not installed. Installing it now..."
    npm install -g aws-cdk
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the aws-infrastructure directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "📦 Installing Lambda dependencies..."
cd lambda/submit-job
npm install
cd ../..

echo "🔧 Bootstrapping CDK (if needed)..."
cdk bootstrap

echo "🚀 Deploying infrastructure..."
cdk deploy --require-approval never

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Copy the API Gateway URL from the output above"
echo "2. Paste it into the Test Runner in your Monaco Editor app"
echo "3. Test the integration by clicking 'Run Test'"
echo ""
echo "🔗 You can also find the API Gateway URL in the AWS Console:"
echo "   https://console.aws.amazon.com/apigateway/" 