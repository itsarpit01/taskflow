const { validationResult } = require('express-validator');
const { isObjectId } = require('../utils/ids');

// Runs after the validator rules; stops the request if any rule failed.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
}

// Use with router.param('taskId', validate.idParam): a malformed id is a 404,
// instead of a database CastError.
validate.idParam = (req, res, next, value) =>
  isObjectId(value) ? next() : res.status(404).json({ error: 'Not found' });

module.exports = validate;
