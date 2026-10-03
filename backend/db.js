const mongoose = require('mongoose');

async function connectDb(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Add it to backend/.env (or Railway Variables).');
  }
  await mongoose.connect(uri);
  // Build indexes (e.g. unique email) before the server accepts requests.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  console.log('✅ MongoDB connected');
}

module.exports = { connectDb };
