const net = require("net");
const path = require("path");
const fs = require("fs");
const { pipeline } = require("stream");
const filePath = path.resolve("data", "info.json");

const socket = net.createConnection(8080, "localhost", async () => {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    console.log("Directory is existing");
  } catch (error) {
    await fs.promises.mkdir("data");
    console.log("Directory was created");
  }
  const writeStream = fs.createWriteStream(filePath);
  socket.setEncoding("utf8");
  const request = {
    name: {
      first: "Nat",
    },
  };
  socket.write(JSON.stringify(request), () => {
    console.log("request sent");
  });
  pipeline(socket, writeStream, (error) => {
    if (error) return console.log("Pipiline is failed");
    console.log("Pipeline is succeded");
  });
});
