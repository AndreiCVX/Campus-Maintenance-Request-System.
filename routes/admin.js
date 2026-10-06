const router = require('express').Router();
const c = require('../controllers/adminController');
const { requireRole } = require('../middleware/auth');
const { assignRules, noteRules, userRules } = require('../middleware/validators');

router.use(requireRole('admin'));

router.get('/', c.dashboard);
router.get('/requests', c.requests);
router.post('/requests/:id/assign', assignRules, c.assign);
router.post('/requests/:id/reopen', noteRules, c.reopen);
router.get('/users', c.users);
router.get('/users/new', c.newUserForm);
router.post('/users', userRules, c.createUser);
router.post('/users/:id/role', c.setRole);
router.post('/users/:id/toggle', c.toggleActive);
router.get('/reports', c.reports);

module.exports = router;
