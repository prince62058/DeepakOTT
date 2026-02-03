// cronJob.js
const cron = require('node-cron');
const MovieRent = require("../models/movieRentModel");
const PurchaseSubscription = require("../models/purchaseSubscriptionModel");

async function doTask() {
  const now = new Date();

  // Deactivate expired movie rents
  const movieResult = await MovieRent.updateMany(
    { isActivePlan: true, planExpireTime: { $lte: now } },
    { $set: { isActivePlan: false } }
  );

  // Deactivate expired purchase subscriptions
  const subscriptionResult = await PurchaseSubscription.updateMany(
    { isActivePlan: true, planExpireTime: { $lte: now } },
    { $set: { isActivePlan: false } }
  );

  console.log(
    `${new Date().toISOString()} - Updated ${movieResult.modifiedCount} MovieRent docs, ${subscriptionResult.modifiedCount} PurchaseSubscription docs`
  );
}

// Prevent overlapping runs
let isRunning = false;

const job = cron.schedule(
  '* * * * *', // every minute
  async () => {
    if (isRunning) {
      console.log(
        new Date().toISOString(),
        '- Previous job still running — skipping this run'
      );
      return;
    }

    try {
      isRunning = true;
      console.log(new Date().toISOString(), '- Job started');
      await doTask();
      console.log(new Date().toISOString(), '- Job finished');
    } catch (err) {
      console.error(new Date().toISOString(), '- Job error:', err);
    } finally {
      isRunning = false;
    }
  },
  {
    scheduled: true,
    timezone: 'Asia/Kolkata', // optional
  }
);

job.start();

process.on('SIGINT', () => {
  console.log('\nGracefully stopping cron...');
  job.stop();
  process.exit(0);
});

module.exports = { job };