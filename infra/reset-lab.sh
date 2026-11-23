#!/usr/bin/env bash
# Lab 7: delete everything the lab created, so you can start again from Part 2.
# Run from the project folder in Git Bash:   bash infra/reset-lab.sh
export AWS_PROFILE=floci AWS_PAGER="" MSYS_NO_PATHCONV=1

aws lambda delete-function --function-name cloud-issue-api 2> /dev/null
aws iam detach-role-policy --role-name cloud-issue-api-role \
  --policy-arn arn:aws:iam::000000000000:policy/issues-table-access 2> /dev/null
aws iam delete-policy --policy-arn arn:aws:iam::000000000000:policy/issues-table-access 2> /dev/null
aws iam delete-role --role-name cloud-issue-api-role 2> /dev/null
aws dynamodb delete-table --table-name CloudIssues > /dev/null 2>&1
aws logs delete-log-group --log-group-name /aws/lambda/cloud-issue-api 2> /dev/null
rm -rf out backend/lambda.zip
echo "Lab reset. Start again from Part 2."
