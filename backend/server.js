require('dotenv').config(); // must be first: other files read process.env when loaded

const app = require('./app');
const { autoSeed } = require('./autoSeed');

const PORT = process.env.PORT || 3001;

async function start() {
  await autoSeed();
  app.listen(PORT, () => console.log(`🚀 TaskFlow API running on port ${PORT}`));
}

start();
