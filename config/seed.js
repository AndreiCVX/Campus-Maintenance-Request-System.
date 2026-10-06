// Creates test accounts and a few sample requests. Safe to run more than once.
const bcrypt = require('bcryptjs');
const pool = require('./db');

const accounts = [
  ['Admin User', 'admin@campus.test', 'Admin123!', 'admin'],
  ['Tech One', 'tech@campus.test', 'Tech123!', 'maintenance'],
  ['Student One', 'student@campus.test', 'Student123!', 'requester']
];

(async () => {
  try {
    for (const [name, email, pw, role] of accounts) {
      const hash = await bcrypt.hash(pw, 10);
      await pool.query(
        'INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?,?,?,?)',
        [name, email, hash, role]
      );
    }
    const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM requests');
    if (n === 0) {
      const [[student]] = await pool.query('SELECT id FROM users WHERE email = ?', ['student@campus.test']);
      const samples = [
        ['Flickering light in lecture hall', 'The ceiling light near the projector flickers every few minutes.', 'electrical', 'Science Building', '204', 'medium'],
        ['Leaking faucet in restroom', 'Second sink from the door drips constantly.', 'plumbing', 'Library', '1F-Restroom', 'low'],
        ['Broken chair in computer lab', 'Chair at station 7 has a cracked seat and is unsafe.', 'furniture', 'IT Building', 'Lab 3', 'high']
      ];
      for (const s of samples) {
        const [r] = await pool.query(
          'INSERT INTO requests (user_id, title, description, category, building, room, urgency) VALUES (?,?,?,?,?,?,?)',
          [student.id, ...s]
        );
        await pool.query(
          'INSERT INTO request_history (request_id, changed_by, old_status, new_status, note) VALUES (?,?,?,?,?)',
          [r.insertId, student.id, null, 'Pending', 'Request submitted']
        );
      }
    }
    console.log('Seed complete.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();