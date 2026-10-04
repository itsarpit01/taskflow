const { z } = require('zod');

const projectFields = z.object({
  name: z.string().trim().min(1, 'Project name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').nullable().optional(),
});

exports.createProjectSchema = projectFields;
exports.updateProjectSchema = projectFields.partial();

exports.memberSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  role: z.enum(['admin', 'member'], { message: 'Role must be admin or member' }).optional(),
});