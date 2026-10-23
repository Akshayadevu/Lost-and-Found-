const express = require('express');
const database = require('../database');
const AppError = require('../utils/appError');
const { authenticate } = require('../middleware/auth');
const { getItem } = require('./items');
const { addHistory } = require('../utils/items');

const router = express.Router();

router.post('/', authenticate, (request, response, next) => {
  try {
    const { itemId, explanation, proofDescription } = request.body;
    const item = getItem(itemId);
    if (!item) throw new AppError('Item report not found.', 404);
    if (item.report_type !== 'FOUND' || !['ACTIVE', 'CLAIM_PENDING'].includes(item.status)) throw new AppError('This item is not available for claims.', 409);
    if (item.user_id === request.user.id) throw new AppError('You cannot claim your own found-item report.', 403);
    if (!explanation?.trim() || !proofDescription?.trim()) throw new AppError('Explain ownership and add a proof description.');
    const duplicate = database.prepare("SELECT id FROM claims WHERE item_id=? AND claimant_id=? AND status='PENDING'").get(item.id, request.user.id);
    if (duplicate) throw new AppError('You already have an active claim for this item.', 409);

    database.exec('BEGIN');
    try {
      const result = database.prepare('INSERT INTO claims (item_id, claimant_id, explanation, proof_description) VALUES (?, ?, ?, ?)')
        .run(item.id, request.user.id, explanation.trim(), proofDescription.trim());
      if (item.status === 'ACTIVE') {
        database.prepare("UPDATE items SET status='CLAIM_PENDING', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(item.id);
        addHistory(database, item.id, request.user.id, 'ACTIVE', 'CLAIM_PENDING', 'Ownership claim submitted.');
      }
      database.exec('COMMIT');
      response.status(201).json({ success: true, message: 'Claim submitted for administrator review.', claimId: Number(result.lastInsertRowid) });
    } catch (error) { database.exec('ROLLBACK'); throw error; }
  } catch (error) { next(error); }
});

router.get('/mine', authenticate, (request, response) => {
  const claims = database.prepare(`SELECT claims.*, items.title, items.category, items.image_filename, items.status AS item_status
    FROM claims JOIN items ON items.id=claims.item_id WHERE claimant_id=? ORDER BY claims.created_at DESC`).all(request.user.id);
  response.json({ success: true, claims });
});

module.exports = router;
