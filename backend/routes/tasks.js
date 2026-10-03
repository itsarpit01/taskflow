const router = require('express').Router({ mergeParams: true });
const { authenticate, requireProjectAccess } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTaskRules, commentRules } = require('../validators/task.validator');
const ctrl = require('../controllers/task.controller');

router.param('taskId', validate.idParam);

// Every task route needs a logged-in user who can access this project.
router.use(authenticate, requireProjectAccess);

router.get('/',    ctrl.list);
router.post('/',   createTaskRules, validate, ctrl.create);
router.put('/:taskId',    ctrl.update);
router.delete('/:taskId', ctrl.remove);

router.get('/:taskId/comments',  ctrl.listComments);
router.post('/:taskId/comments', commentRules, validate, ctrl.addComment);

module.exports = router;
