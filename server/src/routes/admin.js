const express = require('express');
const database = require('../database');
const AppError = require('../utils/appError');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { VALID_STATUSES, addHistory } = require('../utils/items');

const router = express.Router();
router.use(authenticate, requireAdmin);

router.get('/stats', (request, response) => {
  const stats = database.prepare(`SELECT
    COUNT(*) AS total_reports,
    SUM(CASE WHEN report_type='LOST' AND status='ACTIVE' THEN 1 ELSE 0 END) AS active_lost,
    SUM(CASE WHEN report_type='FOUND' AND status='ACTIVE' THEN 1 ELSE 0 END) AS active_found,
    SUM(CASE WHEN status='RETURNED' THEN 1 ELSE 0 END) AS returned_items
    FROM items`).get();
  const pendingClaims = database.prepare("SELECT COUNT(*) AS count FROM claims WHERE status='PENDING'").get().count;
  const categories = database.prepare('SELECT category, COUNT(*) AS count FROM items GROUP BY category ORDER BY count DESC').all();
  response.json({ success: true, stats: { ...stats, pending_claims: pendingClaims }, categories });
});

router.get('/reports', (request, response) => {
  const reports = database.prepare(`SELECT items.*, users.name AS reporter_name, users.email AS reporter_email
    FROM items JOIN users ON users.id=items.user_id ORDER BY items.created_at DESC`).all();
  response.json({ success: true, reports });
});

router.patch('/reports/:id/status', (request, response, next) => {
  try {
    const item = database.prepare('SELECT * FROM items WHERE id=?').get(request.params.id);
    const { status, reason = '' } = request.body;
    if (!item) throw new AppError('Report not found.', 404);
    if (!VALID_STATUSES.includes(status)) throw new AppError('Invalid report status.');
    if (item.status === 'RETURNED' && status !== 'RETURNED') throw new AppError('Returned reports cannot be reopened.');
    database.prepare('UPDATE items SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(status, item.id);
    addHistory(database, item.id, request.user.id, item.status, status, reason.trim() || null);
    response.json({ success: true, message: 'Report status updated.' });
  } catch (error) { next(error); }
});

router.get('/claims', (request, response) => {
  const claims = database.prepare(`SELECT claims.*, items.title, items.status AS item_status, claimants.name AS claimant_name, claimants.email AS claimant_email
    FROM claims JOIN items ON items.id=claims.item_id JOIN users AS claimants ON claimants.id=claims.claimant_id ORDER BY claims.created_at DESC`).all();
  response.json({ success: true, claims });
});

router.patch('/claims/:id/decision', (request, response, next) => {
  try {
    const claim = database.prepare(`SELECT claims.*, items.status AS item_status FROM claims JOIN items ON items.id=claims.item_id WHERE claims.id=?`).get(request.params.id);
    const { decision, reason = '' } = request.body;
    if (!claim) throw new AppError('Claim not found.', 404);
    if (claim.status !== 'PENDING') throw new AppError('This claim has already been reviewed.', 409);
    if (!['APPROVED', 'REJECTED'].includes(decision)) throw new AppError('Decision must be APPROVED or REJECTED.');
    if (!reason.trim()) throw new AppError('Add a short reason for your decision.');

    database.exec('BEGIN');
    try {
      database.prepare("UPDATE claims SET status=?, decision_reason=?, updated_at=CURRENT_TIMESTAMP WHERE id=?").run(decision, reason.trim(), claim.id);
      if (decision === 'APPROVED') {
        database.prepare("UPDATE items SET status='RETURNED', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(claim.item_id);
        addHistory(database, claim.item_id, request.user.id, claim.item_status, 'RETURNED', 'Claim approved: item returned.');
        database.prepare("UPDATE claims SET status='REJECTED', decision_reason='Another ownership claim was approved.', updated_at=CURRENT_TIMESTAMP WHERE item_id=? AND id<>? AND status='PENDING'").run(claim.item_id, claim.id);
      } else {
        const pending = database.prepare("SELECT COUNT(*) AS count FROM claims WHERE item_id=? AND status='PENDING'").get(claim.item_id).count;
        if (pending === 0 && claim.item_status === 'CLAIM_PENDING') {
          database.prepare("UPDATE items SET status='ACTIVE', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(claim.item_id);
          addHistory(database, claim.item_id, request.user.id, 'CLAIM_PENDING', 'ACTIVE', 'All active claims were rejected.');
        }
      }
      database.exec('COMMIT');
      response.json({ success: true, message: `Claim ${decision.toLowerCase()}.` });
    } catch (error) { database.exec('ROLLBACK'); throw error; }
  } catch (error) { next(error); }
});

router.get('/export.csv', (request, response) => {
  const rows = database.prepare('SELECT id, report_type, title, category, location, date_lost_found, status, created_at FROM items ORDER BY created_at DESC').all();
  const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csv = ['ID,Type,Title,Category,Location,Date,Status,Created', ...rows.map(row => [row.id, row.report_type, row.title, row.category, row.location, row.date_lost_found, row.status, row.created_at].map(escape).join(','))].join('\n');
  response.setHeader('Content-Type', 'text/csv');
  response.setHeader('Content-Disposition', 'attachment; filename="findback-reports.csv"');
  response.send(csv);
});

module.exports = router;
