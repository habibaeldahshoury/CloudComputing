const serverless = require('serverless-http');
const loadSecrets = require('./config/loadSecrets');
const createApp = require('./createApp');
let handler;
module.exports.handler = async (event, context) => {
if (!handler) {
await loadSecrets();
handler = serverless(createApp({
'/api/bookings': './routes/bookings',
'/api/reminders': './routes/reminders'
}));
}
return handler(event, context);
};