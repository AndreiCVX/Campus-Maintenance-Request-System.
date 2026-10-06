const router = require('express').Router();
const c = require('../controllers/requestController');
const { requireLogin, requireRole } = require('../middleware/auth');
const { requestRules } = require('../middleware/validators');

// Only requesters create/list/edit/cancel their own requests.
router.get('/', requireRole('requester'), c.list);
router.get('/new', requireRole('requester'), c.newForm);
router.post('/', requireRole('requester'), requestRules, c.create);
router.get('/:id', requireLogin, c.show); // ownership / role checked inside
router.get('/:id/edit', requireRole('requester'), c.editForm);
router.post('/:id/edit', requireRole('requester'), requestRules, c.update);
router.post('/:id/cancel', requireRole('requester'), c.cancel);

module.exports = router;