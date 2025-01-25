import { createClient } from "redis";
import { promisify } from "util";
import express from "express";
import { createQueue } from "kue";

const app = express();
const client = createClient();
const queue = createQueue();
const port = 1245;

client.on("error", (error) => {
  console.log(`Redis client not connected to the server: ${error.message}`);
});

client.on("connect", () => {
  console.log("Redis client connected to the server");
});

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

async function reserveSeat(number) {
  await setAsync("available_seats", String(number));
}

async function getCurrentAvailableSeats() {
  const stock = await getAsync("available_seats");
  return Number(stock);
}

reserveSeat(50);

let reservationEnabled = true;

app.get("/available_seats", async (req, res) => {
  const availableSeats = await getCurrentAvailableSeats();
  res.json({ numberOfAvailableSeats: availableSeats });
});

app.get("/reserve_seat", async (req, res) => {
  if (!reservationEnabled) {
    res.json({ status: "Reservation are blocked" });
    return;
  }

  const availableSeats = await getCurrentAvailableSeats();
  if (availableSeats === 0) {
    res.json({ status: "Reservation are blocked" });
    return;
  }

  try {
    const job = queue.create("reserve_seat", {}).save((err) => {
      if (!err) console.log(`Seat reservation job ${job.id} created`);
    });

    job.on("complete", () => {
      console.log(`Seat reservation job ${job.id} completed`);
    });

    job.on("failed", (err) => {
      console.log(`Seat reservation job ${job.id} failed: ${err}`);
    });

    job.on("progress", (progress) => {
      console.log(`Seat reservation job ${job.id} ${progress}% complete`);
    });

    res.json({ status: "Reservation in process" });
  } catch (err) {
    res.json({ status: "Reservation failed" });
  }
});

app.get("/process", async (req, res) => {
  try {
    const availableSeats = await getCurrentAvailableSeats();

    if (availableSeats === 0) {
      reservationEnabled = false;
      res.json({ status: "Reservation are blocked" });
      return;
    }

    if (availableSeats === 1) {
      reservationEnabled = false;
    }

    queue.process("reserve_seat", async (job, done) => {
      await reserveSeat(availableSeats - 1);
      done();
    });

    res.json({ status: "Queue processing" });
  } catch (error) {
    res.json({ status: "Queue processing failed" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
