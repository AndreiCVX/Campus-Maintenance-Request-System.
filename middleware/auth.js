const pool = require('../config/db');

// Must be logged in, and the account must still be active.
async function requireLogin(req, res, next) {
  try {
    if (!req.session.user) {
      req.session.flash = { type: 'warning', msg: 'Please log in first.' };
      return res.redirect('/login');
    }
    const [rows] = await pool.query('SELECT active, role FROM users WHERE id = ?', [req.session.user.id]);
    if (!rows.length || !rows[0].active) {
      return req.session.regenerate(() => {
        req.session.flash = { type: 'danger', msg: 'Your account is not active.' };
        res.redirect('/login');
      });
    }
    // Always trust the database role over what is stored in the session.
    req.session.user.role = rows[0].role;
    res.locals.user = req.session.user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return [
    requireLogin,
    (req, res, next) => {
      if (!roles.includes(req.session.user.role)) {
        return res.status(403).render('error', {
          title: 'Access denied', code: 403,
          message: 'You do not have permission to view this page.'
        });
      }
      next();
    }
  ];
}

function redirectIfLoggedIn(req, res, next) {
  if (req.session.user) return res.redirect('/dashboard');
  next();
}

module.exports = { requireLogin, requireRole, redirectIfLoggedIn };
