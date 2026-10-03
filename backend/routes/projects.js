const router = require('express').Router();
const { authenticate, requireProjectAccess, requireProjectAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createProjectRules, memberRules } = require('../validators/project.validator');
const ctrl = require('../controllers/project.controller');

router.param('userId', validate.idParam);

router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, createProjectRules, validate, ctrl.create);

router.get('/:projectId', authenticate, requireProjectAccess, ctrl.get);
router.put('/:projectId', authenticate, requireProjectAccess, requireProjectAdmin, ctrl.update);
router.delete('/:projectId', authenticate, requireProjectAccess, requireProjectAdmin, ctrl.remove);

router.post('/:projectId/members', authenticate, requireProjectAccess, requireProjectAdmin, memberRules, validate, ctrl.addMember);
router.delete('/:projectId/members/:userId', authenticate, requireProjectAccess, requireProjectAdmin, ctrl.removeMember);

module.exports = router;
