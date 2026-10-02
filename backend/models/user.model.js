const { getDb } = require('../db');

exports.findByEmail = async (email) => {
  const db = await getDb();
  return db.get('SELECT * FROM users WHERE email = ?', email);
};

exports.emailExists = async (email) => {
  const db = await getDb();
  const row = await db.get('SELECT id FROM users WHERE email = ?', email);
  return !!row;
};

exports.create = async ({ name, email, password, role }) => {
  const db = await getDb();
  const result = await db.run(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    name, email, password, role
  );
  return result.lastID;
};
