const router = require('express').Router();
const c = require('../controllers/techController');
const { requireRole } = require('../middleware/auth');
const { statusRules } = require('../middleware/validators');

router.use(requireRole('maintenance'));

router.get('/jobs', c.jobs);
router.post('/jobs/:id/status', statusRules, c.updateStatus);

module.exports = router;
