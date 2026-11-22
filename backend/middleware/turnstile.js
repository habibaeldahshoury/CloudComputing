async function verifyTurnstile(req, res, next) {
const token = req.headers['x-turnstile-token'];
if (!token) {
return res.status(400).json({ error: { code: 'CAPTCHA_REQUIRED', message:
'Complete the bot check.' } });
}
if (!process.env.TURNSTILE_SECRET) {
return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message:
'Bot check is not configured.' } });
}
try {
const response = await
fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
method: 'POST',
body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET,
response: token }), signal: AbortSignal.timeout(5000)
});
const result = await response.json();
if (!result.success) {
return res.status(403).json({ error: { code: 'CAPTCHA_FAILED', message:
'Bot check failed. Try again.' } });
}
next();
} catch (error) {
next(error);
}
}
module.exports = { verifyTurnstile };
