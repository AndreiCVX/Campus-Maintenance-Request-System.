const bcrypt = require('bcryptjs');
const Request = require('../models/requestModel');
const User = require('../models/userModel');
const { fieldErrors, CATEGORIES, LEVELS, ROLES } = require('../middleware/validators');

const STATUSES = ['Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled'];

exports.dashboard = async (req, res, next) => {
  try {
    const [counts, oldest] = await Promise.all([Request.countsByStatus(), Request.oldestUnresolved(5)]);
    res.render('admin/dashboard', { title: 'Admin dashboard', counts, oldest });
  } catch (err) { next(err); }
};

exports.requests = async (req, res, next) => {
  try {
    const f = {};
    ['status', 'category', 'building', 'urgency', 'q'].forEach(k => { f[k] = (req.query[k] || '').toString().trim().slice(0, 100); });
    if (f.status && !STATUSES.includes(f.status)) f.status = '';
    if (f.category && !CATEGORIES.includes(f.category)) f.category = '';
    if (f.urgency && !LEVELS.includes(f.urgency)) f.urgency = '';
    const requests = await Request.listFiltered(f);
    res.render('admin/requests', { title: 'All requests', requests, f, statuses: STATUSES, categories: CATEGORIES, levels: LEVELS });
  } catch (err) { next(err); }
};

exports.assign = async (req, res, next) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).render('error', { title: 'Not found', code: 404, message: 'Request not found.' });
    const errors = fieldErrors(req);
    if (Object.keys(errors).length) {
      req.session.flash = { type: 'danger', msg: Object.values(errors)[0] };
      return res.redirect(`/requests/${r.id}`);
    }
    if (!['Pending', 'Assigned'].includes(r.status)) {
      req.session.flash = { type: 'warning', msg: 'Only Pending or Assigned requests can be (re)assigned.' };
      return res.redirect(`/requests/${r.id}`);
    }
    const tech = await User.findById(req.body.assigned_to);
    if (!tech || tech.role !== 'maintenance' || !tech.active) {
      req.session.flash = { type: 'danger', msg: 'Pick an active maintenance staff member.' };
      return res.redirect(`/requests/${r.id}`);
    }
    await Request.changeStatus(r.id, req.session.user.id, r.status, 'Assigned',
      `Assigned to ${tech.name} (priority ${req.body.priority})`,
      { assigned_to: tech.id, priority: req.body.priority });
    req.session.flash = { type: 'success', msg: `Assigned to ${tech.name}.` };
    res.redirect(`/requests/${r.id}`);
  } catch (err) { next(err); }
};

exports.reopen = async (req, res, next) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).render('error', { title: 'Not found', code: 404, message: 'Request not found.' });
    const errors = fieldErrors(req);
    if (r.status !== 'Completed' || Object.keys(errors).length) {
      req.session.flash = { type: 'danger', msg: r.status !== 'Completed' ? 'Only Completed requests can be reopened.' : Object.values(errors)[0] };
      return res.redirect(`/requests/${r.id}`);
    }
    await Request.changeStatus(r.id, req.session.user.id, r.status, 'Assigned', `Reopened: ${req.body.note}`);
    req.session.flash = { type: 'success', msg: 'Request reopened.' };
    res.redirect(`/requests/${r.id}`);
  } catch (err) { next(err); }
};

exports.users = async (req, res, next) => {
  try {
    res.render('admin/users', { title: 'Manage users', users: await User.listAll(), roles: ROLES });
  } catch (err) { next(err); }
};

exports.newUserForm = (req, res) => {
  res.render('admin/user-form', { title: 'New user', roles: ROLES, errors: {}, values: { role: 'maintenance' } });
};

exports.createUser = async (req, res, next) => {
  try {
    const errors = fieldErrors(req);
    const values = { name: req.body.name, email: req.body.email, role: req.body.role };
    if (!Object.keys(errors).length && await User.findByEmail(req.body.email)) errors.email = 'That email is already registered.';
    if (Object.keys(errors).length) {
      return res.status(400).render('admin/user-form', { title: 'New user', roles: ROLES, errors, values });
    }
    const passwordHash = await bcrypt.hash(req.body.password, 10);
    await User.create({ name: req.body.name, email: req.body.email, passwordHash, role: req.body.role });
    req.session.flash = { type: 'success', msg: 'User created.' };
    res.redirect('/admin/users');
  } catch (err) { next(err); }
};

exports.setRole = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!ROLES.includes(req.body.role)) {
      req.session.flash = { type: 'danger', msg: 'Invalid role.' };
    } else if (id === req.session.user.id) {
      req.session.flash = { type: 'warning', msg: 'You cannot change your own role.' };
    } else {
      await User.setRole(id, req.body.role);
      req.session.flash = { type: 'success', msg: 'Role updated.' };
    }
    res.redirect('/admin/users');
  } catch (err) { next(err); }
};

exports.toggleActive = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const target = await User.findById(id);
    if (!target) req.session.flash = { type: 'danger', msg: 'User not found.' };
    else if (id === req.session.user.id) req.session.flash = { type: 'warning', msg: 'You cannot deactivate your own account.' };
    else {
      await User.setActive(id, !target.active);
      req.session.flash = { type: 'success', msg: target.active ? 'User deactivated.' : 'User reactivated.' };
    }
    res.redirect('/admin/users');
  } catch (err) { next(err); }
};

exports.reports = async (req, res, next) => {
  try {
    const [byCategory, byBuilding, counts] = await Promise.all([
      Request.countBy('category'), Request.countBy('building'), Request.countsByStatus()
    ]);
    res.render('admin/reports', { title: 'Reports', byCategory, byBuilding, counts });
  } catch (err) { next(err); }
};