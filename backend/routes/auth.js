const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { signupSchema, loginSchema } = require('../validators/auth.validator');
const ctrl = require('../controllers/auth.controller');

router.post('/signup', validate(signupSchema), ctrl.signup);
router.post('/login',  validate(loginSchema),  ctrl.login);
router.get('/me', authenticate, ctrl.me);

module.exports = router;