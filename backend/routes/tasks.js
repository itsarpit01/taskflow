const router = require('express').Router({ mergeParams: true });
const { authenticate, requireProjectAccess } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema, commentSchema } = require('../validators/task.validator');
const ctrl = require('../controllers/task.controller');

router.param('taskId', validate.idParam);

// Every task route needs a logged-in user who can access this project.
router.use(authenticate, requireProjectAccess);

router.get('/',    ctrl.list);
router.post('/',   validate(createTaskSchema), ctrl.create);
router.put('/:taskId',    validate(updateTaskSchema), ctrl.update);
router.delete('/:taskId', ctrl.remove);

router.get('/:taskId/comments',  ctrl.listComments);
router.post('/:taskId/comments', validate(commentSchema), ctrl.addComment);

module.exports = router;