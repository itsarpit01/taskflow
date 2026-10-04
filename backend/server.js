require('dotenv').config();

const app = require('./app');
const { connectDb } = require('./db');
const { autoSeed } = require('./autoSeed');

const PORT = process.env.PORT || 3001;

async function start() {
  await connectDb();
  await autoSeed();
  app.listen(PORT, () => console.log(` TaskFlow API running on port ${PORT}`));
}

start().catch((err) => {
  console.error('❌ Failed to start:', err.message);
  process.exit(1);
});
