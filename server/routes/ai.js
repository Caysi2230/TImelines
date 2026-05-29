const express = require('express');
const router = express.Router();
const { generateTimeline, improveTimeline } = require('../ai');

router.post('/generate', async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'description required' });
    const result = await generateTimeline(description);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/improve/:projectId', async (req, res) => {
  try {
    const result = await improveTimeline(parseInt(req.params.projectId));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
