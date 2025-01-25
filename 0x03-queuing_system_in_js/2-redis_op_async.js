import { createClient } from "redis";
import { promisify } from "util";

const client = createClient();

client.on("error", (error) => {
  console.log("Redis client not connected to the server", error);
});

client.on("connect", () => {
  console.log("Redis client connected to the server");
});

function setNewSchool(schoolName, value) {
  client.set(schoolName, value, (error, reply) => {
    console.log(`Reply: ${reply}`);
  });
}

async function displaySchoolValue(schoolName) {
  let get = promisify(client.get).bind(client);
  let reply = await get(schoolName);
  console.log(reply);
}

displaySchoolValue('Holberton');
setNewSchool('HolbertonSanFrancisco', '100');
displaySchoolValue('HolbertonSanFrancisco')