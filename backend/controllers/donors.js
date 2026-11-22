const donorService = require('../services/donorService');
const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_PATTERN = /^[0-9+\-\s]{7,20}$/;
function sendError(res, status, code, message) {
return res.status(status).json({ error: { code, message } });
}
function ageOf(dateString) {
const born = new Date(`${dateString}T00:00:00Z`);
if (Number.isNaN(born.getTime())) return null;
const now = new Date();
let age = now.getUTCFullYear() - born.getUTCFullYear();
const birthdayPassed = now.getUTCMonth() > born.getUTCMonth() ||
(now.getUTCMonth() === born.getUTCMonth() && now.getUTCDate() >= born.getUTCDate());
if (!birthdayPassed) age -= 1;
return age;
}
function validateProfile(body, partial) {
const { fullName, phone, bloodType, dateOfBirth } = body;
if (!partial || fullName !== undefined) {
if (typeof fullName !== 'string' || fullName.trim().length < 2 || fullName.length > 100) {
return 'fullName must be 2 to 100 characters.';
}
}
if (!partial || bloodType !== undefined) {
if (!BLOOD_TYPES.includes(bloodType)) return `bloodType must be one of ${BLOOD_TYPES.join(', ')}.`;
}
if (phone !== undefined && phone !== null && phone !== '' && !PHONE_PATTERN.test(phone)) {
return 'phone looks invalid.';
}
if (!partial) {
if (typeof dateOfBirth !== 'string' || !DATE_PATTERN.test(dateOfBirth)) {
return 'dateOfBirth must be YYYY-MM-DD.';
}
const age = ageOf(dateOfBirth);
if (age === null || age < 18 || age > 65) return 'Donors must be between 18 and 65 years old.';
}
return null;
}
async function createProfile(req, res, next) {
try {
if (!req.is('application/json')) {
return sendError(res, 415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.');
}
const problem = validateProfile(req.body, false);
if (problem) return sendError(res, 400, 'VALIDATION_ERROR', problem);
try {
const donor = await donorService.createDonor(req.user.id, {
fullName: req.body.fullName.trim(),
phone: req.body.phone,
bloodType: req.body.bloodType,
dateOfBirth: req.body.dateOfBirth
});
res.status(201).json(donor);
} catch (error) {
if (error.code === '23505') {
return sendError(res, 409, 'PROFILE_EXISTS', 'You already have a donor profile.');
}
throw error;
}
} catch (error) {
next(error);
}
}
async function getProfile(req, res, next) {
try {
const donor = await donorService.getDonor(req.user.id);
if (!donor) return sendError(res, 404, 'DONOR_NOT_FOUND', 'Create your donor profile first.');
res.status(200).json(donor);
} catch (error) {
next(error);
}
}
async function updateProfile(req, res, next) {
try {
if (!req.is('application/json')) {
return sendError(res, 415, 'UNSUPPORTED_MEDIA_TYPE', 'Content-Type must be application/json.');
}
const problem = validateProfile(req.body, true);
if (problem) return sendError(res, 400, 'VALIDATION_ERROR', problem);
const donor = await donorService.updateDonor(req.user.id, {
fullName: req.body.fullName === undefined ? undefined : req.body.fullName.trim(),
phone: req.body.phone,
bloodType: req.body.bloodType
});
if (!donor) return sendError(res, 404, 'DONOR_NOT_FOUND', 'Create your donor profile first.');
res.status(200).json(donor);
} catch (error) {
next(error);
}
}
async function getEligibility(req, res, next) {
try {
const result = await donorService.getEligibility(req.user.id);
if (!result) return sendError(res, 404, 'DONOR_NOT_FOUND', 'Create your donor profile first.');
res.status(200).json(result);
} catch (error) {
next(error);
}
}
async function listDonations(req, res, next) {
try {
res.status(200).json(await donorService.listDonations(req.user.id));
} catch (error) {
next(error);
}
}
module.exports = { createProfile, getProfile, updateProfile, getEligibility, listDonations };
