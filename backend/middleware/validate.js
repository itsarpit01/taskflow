const { isObjectId } = require('../utils/ids');

// Usage: router.post('/', validate(someSchema), ctrl.create)
// Checks req.body against a Zod schema. On success, req.body is replaced with the
// cleaned data (unknown fields are removed). On failure, replies 400 { error: '<first message>' }.
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const issue = result.error.issues[0];
      return res.status(400).json({
        error: issue.message,
        field: issue.path.join('.') || undefined,
      });
    }
    req.body = result.data;
    next();
  };
}

// Use with router.param('taskId', validate.idParam): a malformed id is a 404,
// instead of a database CastError.
validate.idParam = (req, res, next, value) =>
  isObjectId(value) ? next() : res.status(404).json({ error: 'Not found' });

module.exports = validate;