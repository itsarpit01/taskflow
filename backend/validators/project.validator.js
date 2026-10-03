const { body } = require('express-validator');

exports.createProjectRules = [
  body('name').trim().notEmpty(),
];

exports.memberRules = [
  body('email').isEmail().normalizeEmail(),
  body('role').optional().isIn(['admin', 'member']),
];
