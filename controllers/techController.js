const Request = require('../models/requestModel');
const { fieldErrors } = require('../middleware/validators');

// Allowed moves for maintenance staff.
const NEXT = { 'Assigned': 'In Progress', 'In Progress': 'Completed' };

exports.jobs = async (req, res, next) => {
  try {
    const requests = await Request.listByTech(req.session.user.id);
    res.render('tech/jobs', { title: 'My assigned jobs', requests });
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).render('error', { title: 'Not found', code: 404, message: 'Request not found.' });
    if (r.assigned_to !== req.session.user.id) {
      return res.status(403).render('error', { title: 'Access denied', code: 403, message: 'This job is not assigned to you.' });
    }
    const errors = fieldErrors(req);
    if (Object.keys(errors).length) {
      req.session.flash = { type: 'danger', msg: Object.values(errors)[0] };
      return res.redirect(`/requests/${r.id}`);
    }
    if (NEXT[r.status] !== req.body.status) {
      req.session.flash = { type: 'danger', msg: `A ${r.status} job cannot be moved to ${req.body.status}.` };
      return res.redirect(`/requests/${r.id}`);
    }
    await Request.changeStatus(r.id, req.session.user.id, r.status, req.body.status, req.body.note);
    req.session.flash = { type: 'success', msg: `Job marked ${req.body.status}.` };
    res.redirect(`/requests/${r.id}`);
  } catch (err) { next(err); }
};
