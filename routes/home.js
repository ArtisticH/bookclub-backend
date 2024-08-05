const express = require('express');
const router = express.Router();
const { Member } = require('../models/models');

router.use((req, res, next) => {
  res.user = req.user;
  next();
});

router.get('/home', async (req, res) => {
  const members = await Member.findAll({
    where: { type: 'MEMBER' },
    attributes: ['id', 'nick'],
  });
  res.json({ user: res.user, members })
});

module.exports = router;