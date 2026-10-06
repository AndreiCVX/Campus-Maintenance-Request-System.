const Request = require('../models/requestModel');
const User = require('../models/userModel');
const { fieldErrors, CATEGORIES, LEVELS } = require('../middleware/validators');

const formData = (body) => ({
  title: body.title, description: body.description, category: body.category,
  building: body.building, room: body.room, urgency: body.urgency
});
const view = (extra) => ({ categories: CATEGORIES, levels: LEVELS, ...extra });

exports.list = async (req, res, next) => {
  try {
    const requests = await Request.listByUser(req.session.user.id);
    res.render('requests/list', { title: 'My requests', requests });
  } catch (err) { next(err); }
};

exports.newForm = (req, res) => {
  res.render('requests/form', view({ title: 'New request', action: '/requests', errors: {}, values: { urgency: 'medium' } }));
};

exports.create = async (req, res, next) => {
  try {
    const errors = fieldErrors(req);
    if (Object.keys(errors).length) {
      return res.status(400).render('requests/form', view({ title: 'New request', action: '/requests', errors, values: formData(req.body) }));
    }
    const id = await Request.create(req.session.user.id, formData(req.body));
    req.session.flash = { type: 'success', msg: 'Request submitted.' };
    res.redirect(`/requests/${id}`);
  } catch (err) { next(err); }
};

function forbidden(res) {
  return res.status(403).render('error', { title: 'Access denied', code: 403, message: 'You cannot view this request.' });
}

exports.show = async (req, res, next) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).render('error', { title: 'Not found', code: 404, message: 'Request not found.' });
    const me = req.session.user;
    const allowed = me.role === 'admin' || r.user_id === me.id || (me.role === 'maintenance' && r.assigned_to === me.id);
    if (!allowed) return forbidden(res);
    const history = await Request.history(r.id);
    const techs = me.role === 'admin' ? await User.listActiveTechs() : [];
    res.render('requests/show', { title: `Request #${r.id}`, r, history, techs, levels: LEVELS, errors: {} });
  } catch (err) { next(err); }
};

async function loadOwnedPending(req, res) {
  const r = await Request.findById(req.params.id);
  if (!r) { res.status(404).render('error', { title: 'Not found', code: 404, message: 'Request not found.' }); return null; }
  if (r.user_id !== req.session.user.id) { forbidden(res); return null; }
  if (r.status !== 'Pending') {
    req.session.flash = { type: 'warning', msg: 'Only Pending requests can be edited or cancelled.' };
    res.redirect(`/requests/${r.id}`);
    return null;
  }
  return r;
}

exports.editForm = async (req, res, next) => {
  try {
    const r = await loadOwnedPending(req, res);
    if (!r) return;
    res.render('requests/form', view({ title: `Edit request #${r.id}`, action: `/requests/${r.id}/edit`, errors: {}, values: r }));
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const r = await loadOwnedPending(req, res);
    if (!r) return;
    const errors = fieldErrors(req);
    if (Object.keys(errors).length) {
      return res.status(400).render('requests/form', view({ title: `Edit request #${r.id}`, action: `/requests/${r.id}/edit`, errors, values: formData(req.body) }));
    }
    await Request.update(r.id, formData(req.body));
    req.session.flash = { type: 'success', msg: 'Request updated.' };
    res.redirect(`/requests/${r.id}`);
  } catch (err) { next(err); }
};

exports.cancel = async (req, res, next) => {
  try {
    const r = await loadOwnedPending(req, res);
    if (!r) return;
    await Request.changeStatus(r.id, req.session.user.id, r.status, 'Cancelled', 'Cancelled by requester');
    req.session.flash = { type: 'success', msg: 'Request cancelled.' };
    res.redirect('/requests');
  } catch (err) { next(err); }
};
