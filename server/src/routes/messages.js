const express = require('express');
const database = require('../database');
const AppError = require('../utils/appError');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function userCanAccessItem(itemId, user) {
  if (user.role === 'ADMIN') return true;
  const item = database.prepare('SELECT user_id FROM items WHERE id=?').get(itemId);
  if (!item) return false;
  if (item.user_id === user.id) return true;
  return Boolean(database.prepare('SELECT id FROM claims WHERE item_id=? AND claimant_id=?').get(itemId, user.id));
}

router.get('/:itemId', authenticate, (request, response, next) => {
  try {
    const itemId = Number(request.params.itemId);
    if (!userCanAccessItem(itemId, request.user)) throw new AppError('You are not authorized to view this conversation.', 403);
    const messages = database.prepare(`SELECT messages.*, sender.name AS sender_name, recipient.name AS recipient_name
      FROM messages JOIN users AS sender ON sender.id=messages.sender_id
      JOIN users AS recipient ON recipient.id=messages.recipient_id
      WHERE messages.item_id=? AND (messages.sender_id=? OR messages.recipient_id=?) ORDER BY messages.created_at ASC`)
      .all(itemId, request.user.id, request.user.id);
    database.prepare('UPDATE messages SET read_at=CURRENT_TIMESTAMP WHERE item_id=? AND recipient_id=? AND read_at IS NULL').run(itemId, request.user.id);
    response.json({ success: true, messages });
  } catch (error) { next(error); }
});

router.post('/:itemId', authenticate, (request, response, next) => {
  try {
    const itemId = Number(request.params.itemId);
    const recipientId = Number(request.body.recipientId);
    const content = request.body.content?.trim();
    if (!content || content.length > 1000) throw new AppError('Write a message up to 1,000 characters long.');
    if (!recipientId || recipientId === request.user.id) throw new AppError('Choose another authorized person to message.');
    if (!userCanAccessItem(itemId, request.user) || !userCanAccessItem(itemId, { id: recipientId, role: 'MEMBER' })) {
      throw new AppError('Messages are limited to people involved with this report.', 403);
    }
    database.prepare('INSERT INTO messages (item_id, sender_id, recipient_id, content) VALUES (?, ?, ?, ?)').run(itemId, request.user.id, recipientId, content);
    response.status(201).json({ success: true, message: 'Message sent.' });
  } catch (error) { next(error); }
});

module.exports = router;
