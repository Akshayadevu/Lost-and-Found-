const express = require('express');
const bcrypt = require('bcryptjs');
const database = require('../database');
const AppError = require('../utils/appError');
const { authenticate } = require('../middleware/auth');
const { createToken } = require('../utils/tokens');

const router = express.Router();
const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000 };

function safeUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at };
}

router.post('/register', async (request, response, next) => {
  try {
    const { name, email, password } = request.body;
    if (!name?.trim() || !email?.trim() || !password) throw new AppError('Name, email, and password are required.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new AppError('Enter a valid email address.');
    if (password.length < 8) throw new AppError('Password must contain at least 8 characters.');

    const normalizedEmail = email.trim().toLowerCase();
    if (database.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail)) {
      throw new AppError('An account already exists with that email.', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = database.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
      .run(name.trim(), normalizedEmail, passwordHash);
    const user = database.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    response.cookie('campusfind_token', createToken(user), cookieOptions);
    response.status(201).json({ success: true, message: 'Welcome to FindBack.', user: safeUser(user) });
  } catch (error) { next(error); }
});

router.post('/login', async (request, response, next) => {
  try {
    const { email, password } = request.body;
    if (!email || !password) throw new AppError('Email and password are required.');
    const user = database.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new AppError('Email or password is incorrect.', 401);
    }
    response.cookie('campusfind_token', createToken(user), cookieOptions);
    response.json({ success: true, message: `Welcome back, ${user.name}.`, user: safeUser(user) });
  } catch (error) { next(error); }
});

router.post('/logout', (request, response) => {
  response.clearCookie('campusfind_token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  response.json({ success: true, message: 'You have been logged out.' });
});

router.get('/me', authenticate, (request, response) => response.json({ success: true, user: safeUser(request.user) }));

module.exports = router;
