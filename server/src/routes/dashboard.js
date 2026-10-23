const express = require('express');
const database = require('../database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, (request, response) => {
  const userId = request.user.id;
  const counts = database.prepare(`SELECT
    SUM(CASE WHEN report_type='LOST' THEN 1 ELSE 0 END) AS lost_reports,
    SUM(CASE WHEN report_type='FOUND' THEN 1 ELSE 0 END) AS found_reports,
    SUM(CASE WHEN status IN ('RETURNED','RESOLVED') THEN 1 ELSE 0 END) AS completed_reports
    FROM items WHERE user_id=?`).get(userId);
  const claimCount = database.prepare('SELECT COUNT(*) AS count FROM claims WHERE claimant_id=?').get(userId).count;
  const recentUpdates = database.prepare(`SELECT item_status_history.*, items.title FROM item_status_history
    JOIN items ON items.id=item_status_history.item_id WHERE items.user_id=? ORDER BY item_status_history.created_at DESC LIMIT 8`).all(userId);
  const unreadMessages = database.prepare('SELECT COUNT(*) AS count FROM messages WHERE recipient_id=? AND read_at IS NULL').get(userId).count;
  response.json({ success: true, counts: { ...counts, claims: claimCount, unreadMessages }, recentUpdates });
});

module.exports = router;
