const express = require('express');
const database = require('../database');
const AppError = require('../utils/appError');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { CATEGORIES, publicItem, addHistory } = require('../utils/items');

const router = express.Router();
const editableStatuses = ['PENDING_REVIEW', 'ACTIVE'];

function getItem(id) {
  return database.prepare(`SELECT items.*, users.name AS reporter_name FROM items JOIN users ON users.id = items.user_id WHERE items.id = ?`).get(id);
}

function validateItem(body) {
  const { reportType, title, category, description, dateLostFound, location, contactDetails } = body;
  if (!['LOST', 'FOUND'].includes(reportType)) throw new AppError('Choose LOST or FOUND for the report type.');
  if (![title, category, description, dateLostFound, location, contactDetails].every(value => value?.trim())) throw new AppError('Complete all required report fields.');
  if (!CATEGORIES.includes(category)) throw new AppError('Choose a valid category.');
  if (title.trim().length > 100 || description.trim().length > 2000) throw new AppError('Title or description is too long.');
}

router.get('/', (request, response, next) => {
  try {
    const { search = '', type = '', category = '', location = '', date = '', page = '1' } = request.query;
    const conditions = ["items.status IN ('ACTIVE', 'CLAIM_PENDING')"];
    const parameters = [];
    if (search.trim()) { conditions.push('(items.title LIKE ? OR items.description LIKE ?)'); parameters.push(`%${search.trim()}%`, `%${search.trim()}%`); }
    if (['LOST', 'FOUND'].includes(type)) { conditions.push('items.report_type = ?'); parameters.push(type); }
    if (CATEGORIES.includes(category)) { conditions.push('items.category = ?'); parameters.push(category); }
    if (location.trim()) { conditions.push('items.location LIKE ?'); parameters.push(`%${location.trim()}%`); }
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) { conditions.push('items.date_lost_found = ?'); parameters.push(date); }
    const currentPage = Math.max(Number.parseInt(page, 10) || 1, 1);
    const limit = 12;
    const where = conditions.join(' AND ');
    const total = database.prepare(`SELECT COUNT(*) AS count FROM items WHERE ${where}`).get(...parameters).count;
    const items = database.prepare(`SELECT items.*, users.name AS reporter_name FROM items JOIN users ON users.id = items.user_id WHERE ${where} ORDER BY items.created_at DESC LIMIT ? OFFSET ?`).all(...parameters, limit, (currentPage - 1) * limit).map(publicItem);
    response.json({ success: true, items, pagination: { page: currentPage, pages: Math.max(1, Math.ceil(total / limit)), total } });
  } catch (error) { next(error); }
});

router.get('/categories', (request, response) => response.json({ success: true, categories: CATEGORIES }));

router.get('/:id', (request, response, next) => {
  try {
    const item = getItem(request.params.id);
    if (!item || !['ACTIVE', 'CLAIM_PENDING'].includes(item.status)) throw new AppError('Report not found.', 404);
    response.json({ success: true, item: publicItem(item) });
  } catch (error) { next(error); }
});

router.post('/duplicate-suggestions', authenticate, (request, response, next) => {
  try {
    const { title = '', category = '', location = '', dateLostFound = '' } = request.body;
    const normalizedTitle = `%${title.trim().toLowerCase()}%`;
    const suggestions = database.prepare(`SELECT id, title, report_type, category, location, date_lost_found, status FROM items
      WHERE status IN ('ACTIVE', 'CLAIM_PENDING') AND category = ? AND (LOWER(title) LIKE ? OR ? LIKE '%' || LOWER(title) || '%')
      AND LOWER(location) LIKE ? AND ABS(julianday(date_lost_found) - julianday(?)) <= 7 LIMIT 5`)
      .all(category, normalizedTitle, title.trim().toLowerCase(), `%${location.trim().toLowerCase()}%`, dateLostFound).map(publicItem);
    response.json({ success: true, suggestions });
  } catch (error) { next(error); }
});

router.post('/', authenticate, upload.single('image'), (request, response, next) => {
  try {
    validateItem(request.body);
    const { reportType, title, category, description, dateLostFound, location, contactDetails, privateDetail = '' } = request.body;
    const result = database.prepare(`INSERT INTO items (user_id, report_type, title, category, description, date_lost_found, location, image_filename, contact_details, private_detail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(request.user.id, reportType, title.trim(), category, description.trim(), dateLostFound, location.trim(), request.file?.filename || null, contactDetails.trim(), privateDetail.trim() || null);
    addHistory(database, result.lastInsertRowid, request.user.id, null, 'PENDING_REVIEW', 'Report submitted for moderation.');
    response.status(201).json({ success: true, message: 'Report submitted for administrator review.', item: getItem(result.lastInsertRowid) });
  } catch (error) { next(error); }
});

router.get('/mine/list', authenticate, (request, response) => {
  const items = database.prepare('SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC').all(request.user.id);
  response.json({ success: true, items });
});

router.put('/:id', authenticate, upload.single('image'), (request, response, next) => {
  try {
    const item = getItem(request.params.id);
    if (!item) throw new AppError('Report not found.', 404);
    if (item.user_id !== request.user.id) throw new AppError('You can edit only your own reports.', 403);
    if (!editableStatuses.includes(item.status)) throw new AppError('This report can no longer be edited.', 409);
    validateItem(request.body);
    const { reportType, title, category, description, dateLostFound, location, contactDetails, privateDetail = '' } = request.body;
    database.prepare(`UPDATE items SET report_type=?, title=?, category=?, description=?, date_lost_found=?, location=?, image_filename=COALESCE(?, image_filename), contact_details=?, private_detail=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
      .run(reportType, title.trim(), category, description.trim(), dateLostFound, location.trim(), request.file?.filename || null, contactDetails.trim(), privateDetail.trim() || null, item.id);
    response.json({ success: true, message: 'Report updated.', item: getItem(item.id) });
  } catch (error) { next(error); }
});

router.patch('/:id/resolve', authenticate, (request, response, next) => {
  try {
    const item = getItem(request.params.id);
    if (!item) throw new AppError('Report not found.', 404);
    if (item.user_id !== request.user.id) throw new AppError('You can resolve only your own report.', 403);
    if (item.report_type !== 'LOST' || !['ACTIVE', 'CLAIM_PENDING'].includes(item.status)) throw new AppError('Only an active lost report can be resolved.', 409);
    database.prepare("UPDATE items SET status='RESOLVED', updated_at=CURRENT_TIMESTAMP WHERE id=?").run(item.id);
    addHistory(database, item.id, request.user.id, item.status, 'RESOLVED', 'Reporter marked this lost item as resolved.');
    response.json({ success: true, message: 'Lost report marked as resolved.' });
  } catch (error) { next(error); }
});

router.delete('/:id', authenticate, (request, response, next) => {
  try {
    const item = getItem(request.params.id);
    if (!item) throw new AppError('Report not found.', 404);
    if (item.user_id !== request.user.id) throw new AppError('You can delete only your own reports.', 403);
    if (!editableStatuses.includes(item.status)) throw new AppError('This report can no longer be deleted.', 409);
    database.prepare('DELETE FROM items WHERE id=?').run(item.id);
    response.json({ success: true, message: 'Report deleted.' });
  } catch (error) { next(error); }
});

module.exports = { router, getItem };
