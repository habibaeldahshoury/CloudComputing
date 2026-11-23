const { SQSClient, GetQueueUrlCommand, SendMessageCommand,
ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/clientsqs');
const sqs = new SQSClient({ region: 'us-east-1' });
let queueUrl;
async function getUrl() {
if (!queueUrl) {
const r = await sqs.send(new GetQueueUrlCommand({ QueueName: 'remindersqueue' }));
queueUrl = r.QueueUrl;
}
return queueUrl;
}
async function sendJob(job) {
await sqs.send(new SendMessageCommand({ QueueUrl: await getUrl(),
MessageBody: JSON.stringify(job) }));
}
async function receiveJobs() {
const r = await sqs.send(new ReceiveMessageCommand({
QueueUrl: await getUrl(), MaxNumberOfMessages: 5, WaitTimeSeconds: 5
}));
return r.Messages || [];
}
async function deleteJob(message) {
await sqs.send(new DeleteMessageCommand({ QueueUrl: await getUrl(),
ReceiptHandle: message.ReceiptHandle }));
}
module.exports = { sendJob, receiveJobs, deleteJob };