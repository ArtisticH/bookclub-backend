const express = require('express');
const { upload } = require('../tools/multer');
const router = express.Router();

// 이미지 직접 올릴때
router.post('/preview', upload.single('image'), (req, res) => {
  try {
    const url = `/img/${req.file.filename}`;
    res.json({ url });  
  } catch(err) {
    console.error(err);
  }
});

module.exports = router;