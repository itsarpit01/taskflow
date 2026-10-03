const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { signupRules, loginRules } = require('../validators/auth.validator');
const ctrl = require('../controllers/auth.controller');

router.post('/signup', signupRules, validate, ctrl.signup);
router.post('/login',  loginRules,  validate, ctrl.login);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
