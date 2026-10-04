const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/user.controller');

router.param('userId', validate.idParam);

// Admin-only user management. The role value is checked in user.controller.js.
router.use(authenticate, requireAdmin);
router.get('/', ctrl.list);
router.put('/:userId/role', ctrl.updateRole);

module.exports = router;