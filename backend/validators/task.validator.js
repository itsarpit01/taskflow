const { body } = require('express-validator');

exports.createTaskRules = [
  body('title').trim().notEmpty(),
  body('assignee_id').optional().isInt(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('due_date').optional(),
];

exports.commentRules = [
  body('content').trim().notEmpty(),
];
