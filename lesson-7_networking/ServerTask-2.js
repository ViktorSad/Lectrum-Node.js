/* 
I decided to make this taks with Transform streams
I think it  will be usefull in the future
*/
const net = require("net");
const path = require("path");
const { Readable, pipeline } = require("stream");
const { createGzip } = require("zlib");
const PORT = process.argv[2] || 8080;
const ADDRESS = process.argv[3] || "localhost";
const filePath = process.argv[4] || path.resolve("users.json");
const jsonData = require(filePath);
const { Research, Json2Csv } = require("./customStreams");
//  validate filter Data
function validate(filter, requiredObject) {
  for (const key in filter) {
    if (typeof filter[key] === typeof requiredObject[key]) {
      if (key === "name" && Object.keys(filter[key]).length === 0) {
        throw new TypeError(` KEY: "${key}" can  not be empty`);
      }
      if (key === "address" && Object.keys(filter[key]).length === 0) {
        throw new TypeError(` KEY: "${key}" can  not be empty`);
      }
      if (typeof filter[key] === "object") {
        validate(filter[key], requiredObject[key]);
      }
    } else {
      throw new TypeError(` KEY: "${key}" is not acceptable`);
    }
  }
}
// Validate meta data
function validateMeta(meta) {
  if (meta.format !== undefined && meta.format !== "csv")
    throw new TypeError("Wrong format ");
  if (meta.archive !== undefined && typeof meta.archive !== "boolean")
    throw new TypeError("Wrong type of archive field ");
}
const server = net.createServer((socket) => {
  console.log("Client has been connected");
  server.getConnections((err, counts) => {
    console.log("Number of connected clients:", counts);
  });
  socket.setEncoding("utf8");
  socket.on("data", (data) => {
    try {
      data = JSON.parse(data);
      const filter = data.filter;
      if (!filter) throw new TypeError(" No filter"); // Throw error if there is no filter
      const meta = data.meta;
      if (!meta) throw new TypeError(" No meta"); // Throw error of there is no meta
      validateMeta(meta);
      validate(filter, jsonData[0]);
      //  Creating pipes
      const readData = Readable.from(jsonData, { objectMode: true });
      const research = new Research(filter); // filter data
      const json2csv = new Json2Csv(); // json to csv
      const zip = createGzip(); // zip archive
      //  making pipelines depends on meta
      switch (true) {
        case meta.format && meta.archive:
          console.log("send csv archive");
          pipeline(readData, research, json2csv, zip, socket, (error) => {
            if (error) return console.log("Pipeline is fault");
            console.log("Pipeline succeeded");
          });
          break;
        case Boolean(meta.format):
          console.log("send csv");
          pipeline(readData, research, json2csv, socket, (error) => {
            if (error) return console.log("Pipeline is fault");
            console.log("Pipeline succeeded");
          });
          break;
        case meta.archive:
          console.log("send archive");
          pipeline(readData, research, zip, socket, (error) => {
            if (error) return console.log("Pipeline is fault");
            console.log("Pipeline succeeded");
          });
          break;
        default:
          console.log("send JSON");
          pipeline(readData, research, socket, (error) => {
            if (error) return console.log("Pipeline is fault");
            console.log("Pipeline succeeded");
          });
      }
    } catch (err) {
      socket.write(`Inncorect request: ${err.message}`);
      socket.end();
    }
    socket.on("end", () => {
      console.log(` Client: ${socket.address().address} disconected`);
    });
    socket.on("close", () => {
      server.getConnections((err, counts) => {
        console.log("Number of connected clients:", counts);
      });
    });
  });
});
server.on("error", (error) => {
  console.log(error);
});
server.listen(PORT, ADDRESS, () => {
  console.log(` Server has started on port: ${PORT}, address: ${ADDRESS}`);
});
