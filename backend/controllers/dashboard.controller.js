const Dashboard = require('../models/dashboard.model');

exports.get = async (req, res) => {
  try {
    res.json(await Dashboard.forUser(req.user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
};
