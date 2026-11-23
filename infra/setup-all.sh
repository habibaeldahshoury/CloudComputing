#!/usr/bin/env bash
# Lab 7: build the WHOLE backend in one go (use it to catch up, or to rebuild after a reset).
# Run from the project folder in Git Bash:   bash infra/setup-all.sh
export AWS_PROFILE=floci AWS_PAGER="" MSYS_NO_PATHCONV=1

echo "1/5 DynamoDB table + first issue"
aws dynamodb create-table --table-name CloudIssues \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST > /dev/null 2>&1
aws dynamodb wait table-exists --table-name CloudIssues
aws dynamodb put-item --table-name CloudIssues --item file://infra/dynamodb/seed-item.json

echo "2/5 IAM role + policy"
aws iam create-role --role-name cloud-issue-api-role \
  --assume-role-policy-document file://infra/iam/trust-policy.json > /dev/null 2>&1
aws iam create-policy --policy-name issues-table-access \
  --policy-document file://infra/iam/issues-table-policy.json > /dev/null 2>&1
aws iam attach-role-policy --role-name cloud-issue-api-role \
  --policy-arn arn:aws:iam::000000000000:policy/issues-table-access

echo "3/5 Install and zip the backend"
(cd backend && npm install --no-audit --no-fund --loglevel=error && npm run zip --silent)

echo "4/5 Lambda function"
aws lambda create-function --function-name cloud-issue-api \
  --runtime nodejs24.x --handler lambda.handler \
  --role arn:aws:iam::000000000000:role/cloud-issue-api-role \
  --zip-file fileb://backend/lambda.zip --timeout 10 \
  --environment "Variables={DYNAMODB_TABLE=CloudIssues}" > /dev/null 2>&1 \
|| aws lambda update-function-code --function-name cloud-issue-api \
     --zip-file fileb://backend/lambda.zip > /dev/null
aws lambda wait function-active-v2 --function-name cloud-issue-api

echo "5/5 Test: list issues"
mkdir -p out
aws lambda invoke --function-name cloud-issue-api \
  --payload file://backend/events/1-list-issues.json \
  --cli-binary-format raw-in-base64-out out/result.json > /dev/null
cat out/result.json; echo
echo "Done."
