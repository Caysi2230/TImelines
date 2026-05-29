const express = require('express');
const router = express.Router();
const { sendMorningBriefing } = require('../email');

router.post('/test', async (req, res) => {
  try {
    const result = await sendMorningBriefing();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
