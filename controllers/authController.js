const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { fieldErrors } = require('../middleware/validators');

exports.showRegister = (req, res) => res.render('register', { title: 'Register', errors: {}, values: {} });

exports.register = async (req, res, next) => {
  try {
    const errors = fieldErrors(req);
    const values = { name: req.body.name, email: req.body.email };
    if (!Object.keys(errors).length && await User.findByEmail(req.body.email)) {
      errors.email = 'That email is already registered.';
    }
    if (Object.keys(errors).length) {
      return res.status(400).render('register', { title: 'Register', errors, values });
    }
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    await User.create({ name: req.body.name, email: req.body.email, passwordHash, role: 'requester' });
    req.session.flash = { type: 'success', msg: 'Account created. You can log in now.' };
    res.redirect('/login');
  } catch (err) { next(err); }
};

exports.showLogin = (req, res) => res.render('login', { title: 'Log in', errors: {}, values: {}, formError: null });

exports.login = async (req, res, next) => {
  try {
    const errors = fieldErrors(req);
    const values = { email: req.body.email };
    if (Object.keys(errors).length) {
      return res.status(400).render('login', { title: 'Log in', errors, values, formError: null });
    }
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findByEmail(email);
    const ok = user && await bcrypt.compare(req.body.password, user.password_hash);
    if (!ok) {
      return res.status(401).render('login', { title: 'Log in', errors: {}, values, formError: 'Invalid email or password.' });
    }
    if (!user.active) {
      return res.status(403).render('login', { title: 'Log in', errors: {}, values, formError: 'This account has been deactivated.' });
    }
    // New session id on login prevents session fixation.
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
      res.redirect('/dashboard');
    });
  } catch (err) { next(err); }
};

exports.logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
};

exports.dashboard = (req, res) => {
  const role = req.session.user.role;
  if (role === 'admin') return res.redirect('/admin');
  if (role === 'maintenance') return res.redirect('/tech/jobs');
  res.redirect('/requests');
};
