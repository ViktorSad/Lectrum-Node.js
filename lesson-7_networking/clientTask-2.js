const net = require("net");
const path = require("path");
const fs = require("fs");
const { pipeline } = require("stream");
const socket = net.createConnection(8080, "localhost", async () => {
  const request = {
    filter: {
      name: {
        first: "Nat",
      },
    },
    meta: {
      archive: false,
    },
  };
  const meta = request.meta;
  let filePath = "";
  //   creating path for proper file
  switch (true) {
    case meta.format && meta.archive:
      console.log("Expecting info.csv.gz");
      filePath = path.resolve("data", "info.csv.gz");
      break;
    case Boolean(meta.format):
      console.log("Expecting info.csv");
      filePath = path.resolve("data", "info.csv");
      break;
    case meta.archive:
      console.log("Expecting info.json.gz");
      filePath = path.resolve("data", "info.json.gz");
      break;
    default:
      console.log(" Expecting json file");
      filePath = path.resolve("data", "info.json");
  }
  try {
    await fs.promises.access(path.dirname(filePath), fs.constants.F_OK);
    console.log("Directory is existing");
  } catch (error) {
    await fs.promises.mkdir("data");
    console.log("Directory was created");
  }
  //   Sending request
  socket.write(JSON.stringify(request), () => {
    console.log("request sent");
  });
  //   creating write stream and pipeline
  const writeStream = fs.createWriteStream(filePath);
  socket.setEncoding("utf8");
  pipeline(socket, writeStream, (error) => {
    if (error) return console.log("Pipiline is fault");
    console.log("Pipeline is succeeded");
  });
  socket.on("close", () => {
    console.log(" Client disconnected");
  });
});
