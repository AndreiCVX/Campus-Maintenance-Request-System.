const pool = require('../config/db');

exports.findByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

exports.findById = async (id) => {
  const [rows] = await pool.query('SELECT id, name, email, role, active FROM users WHERE id = ?', [id]);
  return rows[0];
};

exports.create = async ({ name, email, passwordHash, role }) => {
  const [r] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)',
    [name, email, passwordHash, role]
  );
  return r.insertId;
};

exports.listAll = async () => {
  const [rows] = await pool.query('SELECT id, name, email, role, active, created_at FROM users ORDER BY created_at DESC');
  return rows;
};

exports.listActiveTechs = async () => {
  const [rows] = await pool.query("SELECT id, name FROM users WHERE role = 'maintenance' AND active = 1 ORDER BY name");
  return rows;
};

exports.setRole = (id, role) => pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
exports.setActive = (id, active) => pool.query('UPDATE users SET active = ? WHERE id = ?', [active ? 1 : 0, id]);
