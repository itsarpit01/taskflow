// A MongoDB id is a 24-character hex string. Anything else (like "5" or "abc")
// would make Mongoose throw a CastError, so we check before querying.
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

exports.isObjectId = (value) => typeof value === 'string' && OBJECT_ID_RE.test(value);
