// Turns a Mongo document into the shape the old SQL API returned
// (_id -> id, no __v), so the React frontend does not need to change.
const toLegacy = (doc) => {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc;
  return { id: String(_id), ...rest };
};

module.exports = { toLegacy };
