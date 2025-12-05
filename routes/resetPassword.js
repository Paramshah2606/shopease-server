const express = require('express');
const router = express.Router();
const common=require("../config/common");
const bcrypt = require('bcrypt');
const saltRounds = 10;

// GET - Show password reset form
router.get('/', async (req, res) => {
  const { token } = req.query;

  if (!token) return res.render('reset-password', { error: ['Missing token'], success: null,token, hide: true });

  const rows = await common.executeQuery(
    'SELECT id FROM tbl_reset_password WHERE token = ?',
    [token]
  );

  if (rows.length === 0) {
    return res.render('reset-password', {
      error: ['Link has expired or is invalid'],
      success:null,
      hide: true,
    });
  }

  res.render('reset-password', {
    error: null,
    success: null,
    token,
    hide: false,
  });
});

// POST - Submit new password
router.post('/', async (req, res) => {
  const { password, passwordConfirm, token } = req.body;
  const errors = [];

  if (!password || !passwordConfirm) errors.push('All fields are required.');
  if (password !== passwordConfirm) errors.push('Passwords do not match.');

  const rows = await common.executeQuery(
    'SELECT user_id FROM tbl_reset_password WHERE token = ?',
    [token]
  );

  if (rows.length === 0) errors.push('Link has expired or is invalid');

  if (errors.length > 0) {
    return res.render('reset-password', {
      error: errors,
      success: null,
      token,
      hide: false,
    });
  }

  const user_id = rows[0].user_id;
  let hashed_password;
  if (password) {
    hashed_password = await bcrypt.hash(password, saltRounds);
  }

  await common.executeQuery('UPDATE tbl_user SET password = ? WHERE id = ?', [
    hashed_password,
    user_id,
  ]);

  await common.executeQuery('DELETE FROM tbl_reset_password WHERE token = ?', [token]);

  res.render('reset-password', {
    error: null,
    success: 'Your password has been updated successfully.',
    hide: true,
  });
});

module.exports = router;
