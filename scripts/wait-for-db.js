const net = require("node:net");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const url = new URL(databaseUrl);
const host = url.hostname;
const port = Number(url.port || 5432);

const timeoutMs = 60_000;
const start = Date.now();

function check() {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });
    socket.once("error", (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

async function wait() {
  while (Date.now() - start < timeoutMs) {
    try {
      await check();
      console.log("Database is ready.");
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  console.error("Timed out waiting for database.");
  process.exit(1);
}

wait();
