const router = require('express').Router();
const auth = require('../controllers/authController');
const { redirectIfLoggedIn, requireLogin } = require('../middleware/auth');
const { registerRules, loginRules } = require('../middleware/validators');

router.get('/', (req, res) => res.redirect(req.session.user ? '/dashboard' : '/login'));
router.get('/register', redirectIfLoggedIn, auth.showRegister);
router.post('/register', redirectIfLoggedIn, registerRules, auth.register);
router.get('/login', redirectIfLoggedIn, auth.showLogin);
router.post('/login', redirectIfLoggedIn, loginRules, auth.login);
router.post('/logout', auth.logout);
router.get('/dashboard', requireLogin, auth.dashboard);

module.exports = router;
