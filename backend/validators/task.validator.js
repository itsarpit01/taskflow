const { body } = require('express-validator');

exports.createTaskRules = [
  body('title').trim().notEmpty(),
  // MongoDB ids are 24-char hex strings, not integers.
  body('assignee_id').optional({ checkFalsy: true }).isMongoId(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('due_date').optional(),
];

exports.commentRules = [
  body('content').trim().notEmpty(),
];
