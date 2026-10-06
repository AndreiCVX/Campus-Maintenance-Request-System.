require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');

if (!process.env.SESSION_SECRET) {
  console.error('SESSION_SECRET is missing. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// MemoryStore is fine for a class project. Sessions reset when the server restarts.
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 30 * 60 * 1000 } // 30 min idle timeout
}));

// Helpers available in every view.
app.locals.fmt = (d) => (d ? new Date(d).toLocaleString() : '');
app.locals.badge = (status) => ({
  'Pending': 'secondary', 'Assigned': 'info', 'In Progress': 'warning',
  'Completed': 'success', 'Cancelled': 'dark'
}[status] || 'secondary');
app.locals.cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.use('/', require('./routes/auth'));
app.use('/requests', require('./routes/requests'));
app.use('/admin', require('./routes/admin'));
app.use('/tech', require('./routes/tech'));

app.use((req, res) => {
  res.status(404).render('error', { title: 'Not found', code: 404, message: 'That page does not exist.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'Server error', code: 500, message: 'Something went wrong on our side.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running at http://localhost:${PORT}`));
