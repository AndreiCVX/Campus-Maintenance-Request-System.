const { body, validationResult } = require('express-validator');

const CATEGORIES = ['electrical', 'plumbing', 'furniture', 'hvac', 'cleaning', 'other'];
const LEVELS = ['low', 'medium', 'high'];
const ROLES = ['requester', 'maintenance', 'admin'];

const password = body('password')
  .isLength({ min: 8, max: 72 }).withMessage('Password must be 8 to 72 characters.')
  .matches(/[A-Za-z]/).withMessage('Password needs at least one letter.')
  .matches(/\d/).withMessage('Password needs at least one number.');

const name = body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2 to 100 characters.');
const email = body('email').trim().toLowerCase().isEmail().withMessage('Enter a valid email address.').isLength({ max: 150 });

const registerRules = [
  name, email, password,
  body('confirm').custom((v, { req }) => v === req.body.password).withMessage('Passwords do not match.')
];

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required.'),
  body('password').notEmpty().withMessage('Password is required.')
];

const requestRules = [
  body('title').trim().isLength({ min: 5, max: 100 }).withMessage('Title must be 5 to 100 characters.'),
  body('description').trim().isLength({ min: 10, max: 1000 }).withMessage('Description must be 10 to 1000 characters.'),
  body('category').isIn(CATEGORIES).withMessage('Choose a category.'),
  body('building').trim().isLength({ min: 2, max: 50 }).withMessage('Building must be 2 to 50 characters.'),
  body('room').trim().isLength({ min: 1, max: 20 }).withMessage('Room is required (max 20 characters).'),
  body('urgency').isIn(LEVELS).withMessage('Choose an urgency.')
];

const assignRules = [
  body('assigned_to').isInt({ min: 1 }).withMessage('Choose a technician.'),
  body('priority').isIn(LEVELS).withMessage('Choose a priority.')
];

const statusRules = [
  body('status').isIn(['In Progress', 'Completed']).withMessage('Invalid status.'),
  body('note').trim().isLength({ min: 3, max: 500 }).withMessage('Add a note (3 to 500 characters).')
];

const noteRules = [
  body('note').trim().isLength({ min: 3, max: 500 }).withMessage('Add a note (3 to 500 characters).')
];

const userRules = [
  name, email, password,
  body('role').isIn(ROLES).withMessage('Choose a role.')
];

// Returns { field: message } for the first error on each field.
function fieldErrors(req) {
  const result = validationResult(req);
  const out = {};
  result.array().forEach(e => { if (!out[e.path]) out[e.path] = e.msg; });
  return out;
}

module.exports = {
  registerRules, loginRules, requestRules, assignRules, statusRules, noteRules, userRules,
  fieldErrors, CATEGORIES, LEVELS, ROLES
};
