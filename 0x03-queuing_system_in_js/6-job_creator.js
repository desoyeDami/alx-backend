import { createQueue } from "kue";

const queue = createQueue();

const jobData = {
  phoneNumber: "0987654321",
  message: "Hey, people!",
};

const job = queue.create("push_notification_code", jobData).save((err) => {
  if (!err) console.log(`Notification job created: ${job.id}`);
}).on("complete", () => {
  console.log("Notification job completed");
}).on("failed", (err) => {
  console.log("Notification job failed");
});
