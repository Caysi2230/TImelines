const cron = require('node-cron');
const { sendMorningBriefing } = require('./email');

function startCron() {
  // Every day at 7:00 AM
  cron.schedule('0 7 * * *', async () => {
    console.log('[cron] Sending morning briefing...');
    try {
      const result = await sendMorningBriefing();
      if (result.skipped) {
        console.log('[cron] Skipped:', result.reason);
      } else {
        console.log('[cron] Briefing sent to', result.to);
      }
    } catch (err) {
      console.error('[cron] Failed to send briefing:', err.message);
    }
  });
  console.log('[cron] Morning briefing scheduled for 7:00 AM daily');
}

module.exports = { startCron };
