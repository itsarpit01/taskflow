const { z } = require('zod');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const validDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Due date must be a valid date');

const taskFields = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').nullable().optional(),
  // '' and null mean "no assignee" / "no date" (the form can send either)
  assignee_id: z.union([objectId, z.literal(''), z.null()]).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], { message: 'Priority must be low, medium, high or urgent' }).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done'], { message: 'Status must be todo, in_progress, review or done' }).optional(),
  due_date: z.union([validDate, z.literal(''), z.null()]).optional(),
});

exports.createTaskSchema = taskFields;
exports.updateTaskSchema = taskFields.partial(); // every field optional, but checked if sent

exports.commentSchema = z.object({
  content: z.string().trim().min(1, 'Comment cannot be empty').max(1000, 'Comment must be 1000 characters or less'),
});