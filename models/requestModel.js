const pool = require('../config/db');

const BASE = `
  SELECT r.*, u.name AS requester_name, t.name AS tech_name
  FROM requests r
  JOIN users u ON u.id = r.user_id
  LEFT JOIN users t ON t.id = r.assigned_to`;

async function log(conn, requestId, userId, oldStatus, newStatus, note) {
  await conn.query(
    'INSERT INTO request_history (request_id, changed_by, old_status, new_status, note) VALUES (?,?,?,?,?)',
    [requestId, userId, oldStatus, newStatus, note || null]
  );
}

exports.create = async (userId, d) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO requests (user_id, title, description, category, building, room, urgency)
       VALUES (?,?,?,?,?,?,?)`,
      [userId, d.title, d.description, d.category, d.building, d.room, d.urgency]
    );
    await log(conn, r.insertId, userId, null, 'Pending', 'Request submitted');
    await conn.commit();
    return r.insertId;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

exports.findById = async (id) => {
  const [rows] = await pool.query(`${BASE} WHERE r.id = ?`, [id]);
  return rows[0];
};

exports.history = async (id) => {
  const [rows] = await pool.query(
    `SELECT h.*, u.name AS who FROM request_history h
     JOIN users u ON u.id = h.changed_by
     WHERE h.request_id = ? ORDER BY h.created_at, h.id`, [id]);
  return rows;
};

exports.listByUser = async (userId) => {
  const [rows] = await pool.query(`${BASE} WHERE r.user_id = ? ORDER BY r.created_at DESC`, [userId]);
  return rows;
};

exports.listByTech = async (techId) => {
  const [rows] = await pool.query(
    `${BASE} WHERE r.assigned_to = ? ORDER BY FIELD(r.status,'Assigned','In Progress','Completed'), r.created_at DESC`,
    [techId]);
  return rows;
};

exports.listFiltered = async ({ status, category, building, urgency, q }) => {
  const where = [];
  const params = [];
  if (status) { where.push('r.status = ?'); params.push(status); }
  if (category) { where.push('r.category = ?'); params.push(category); }
  if (urgency) { where.push('r.urgency = ?'); params.push(urgency); }
  if (building) { where.push('r.building LIKE ?'); params.push(`%${building}%`); }
  if (q) { where.push('(r.title LIKE ? OR r.description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  const sql = `${BASE} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY r.created_at DESC`;
  const [rows] = await pool.query(sql, params);
  return rows;
};

exports.update = (id, d) => pool.query(
  `UPDATE requests SET title=?, description=?, category=?, building=?, room=?, urgency=? WHERE id=?`,
  [d.title, d.description, d.category, d.building, d.room, d.urgency, id]
);

// Generic status change with history, done in one transaction.
exports.changeStatus = async (id, userId, oldStatus, newStatus, note, extra = {}) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const sets = ['status = ?'];
    const params = [newStatus];
    if (extra.assigned_to !== undefined) { sets.push('assigned_to = ?'); params.push(extra.assigned_to); }
    if (extra.priority !== undefined) { sets.push('priority = ?'); params.push(extra.priority); }
    params.push(id);
    await conn.query(`UPDATE requests SET ${sets.join(', ')} WHERE id = ?`, params);
    await log(conn, id, userId, oldStatus, newStatus, note);
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
};

exports.countsByStatus = async () => {
  const [rows] = await pool.query('SELECT status, COUNT(*) AS n FROM requests GROUP BY status');
  const out = { Pending: 0, Assigned: 0, 'In Progress': 0, Completed: 0, Cancelled: 0 };
  rows.forEach(r => { out[r.status] = r.n; });
  return out;
};

exports.oldestUnresolved = async (limit = 5) => {
  const [rows] = await pool.query(
    `${BASE} WHERE r.status IN ('Pending','Assigned','In Progress') ORDER BY r.created_at ASC LIMIT ?`, [limit]);
  return rows;
};

exports.countBy = async (column) => {
  if (!['category', 'building'].includes(column)) throw new Error('Bad column');
  const [rows] = await pool.query(`SELECT ${column} AS label, COUNT(*) AS n FROM requests GROUP BY ${column} ORDER BY n DESC`);
  return rows;
};