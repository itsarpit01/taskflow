const { z } = require('zod');

const email = z.string().trim().toLowerCase().email('Enter a valid email address');

// No "role" field on purpose: Zod removes unknown fields, so nobody can sign up as admin.
exports.signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  email,
  password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password must be 100 characters or less'),
});

exports.loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});