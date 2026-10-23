const jwt = require('jsonwebtoken');

function getSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is missing. Copy .env.example to .env and set a local secret.');
  }
  return process.env.JWT_SECRET;
}

function createToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, getSecret(), { expiresIn: '8h' });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { createToken, verifyToken };
