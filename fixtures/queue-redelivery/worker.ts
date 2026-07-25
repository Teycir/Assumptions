// Fixture: queue-redelivery
// A worker that sends an email before acknowledging the queue message,
// with no durable record of whether the send already happened.

async function handleJob(job: Job) {
  await sendEmail(job.data.email);
  await job.ack();
}
