const VALID_STATUSES = ['PENDING_REVIEW', 'ACTIVE', 'CLAIM_PENDING', 'RETURNED', 'RESOLVED', 'REJECTED'];
const CATEGORIES = ['Electronics', 'ID cards', 'Books and stationery', 'Bags', 'Clothing', 'Accessories', 'Keys', 'Water bottles', 'Wallets', 'Documents', 'Other'];

function publicItem(item) {
  if (!item) return item;
  const { contact_details, private_detail, ...safeItem } = item;
  return safeItem;
}

function addHistory(database, itemId, actorId, previousStatus, newStatus, reason = null) {
  database.prepare(`INSERT INTO item_status_history (item_id, actor_id, previous_status, new_status, reason)
    VALUES (?, ?, ?, ?, ?)`)
    .run(itemId, actorId, previousStatus, newStatus, reason);
}

module.exports = { VALID_STATUSES, CATEGORIES, publicItem, addHistory };
