const { validationResult } = require('express-validator');

// Runs after the validator rules; stops the request if any rule failed.
module.exports = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  next();
};
