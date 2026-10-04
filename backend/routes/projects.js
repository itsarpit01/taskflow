const router = require('express').Router();
const { authenticate, requireProjectAccess, requireProjectAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createProjectSchema, updateProjectSchema, memberSchema } = require('../validators/project.validator');
const ctrl = require('../controllers/project.controller');

router.param('userId', validate.idParam);
router.param('projectId', validate.idParam);

router.get('/', authenticate, ctrl.list);
router.post('/', authenticate, validate(createProjectSchema), ctrl.create);

router.get('/:projectId', authenticate, requireProjectAccess, ctrl.get);
router.put('/:projectId', authenticate, requireProjectAccess, requireProjectAdmin, validate(updateProjectSchema), ctrl.update);
router.delete('/:projectId', authenticate, requireProjectAccess, requireProjectAdmin, ctrl.remove);

router.post('/:projectId/members', authenticate, requireProjectAccess, requireProjectAdmin, validate(memberSchema), ctrl.addMember);
router.delete('/:projectId/members/:userId', authenticate, requireProjectAccess, requireProjectAdmin, ctrl.removeMember);

module.exports = router;