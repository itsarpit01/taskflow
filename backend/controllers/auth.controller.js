const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const { generateToken } = require('../middleware/auth');

exports.signup = async (req, res) => {
  // Role from the request body is ignored: public signup always creates a member.
  // Admins are created by autoSeed or promoted by an existing admin on the Users page.
  const { name, email, password } = req.body;
  const role = 'member';
  try {
    if (await User.emailExists(email)) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const id = await User.create({ name, email, password: hashed, role });
    const user = { id, name, email, role };
    res.status(201).json({ token: generateToken(id), user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const { password: _omit, ...safeUser } = user;
    res.json({ token: generateToken(user.id), user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.me = (req, res) => res.json({ user: req.user });