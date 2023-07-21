const net = require("net");
const path = require("path");
const PORT = process.argv[2] || 8080;
const ADDRESS = process.argv[3] || "localhost";
const filePath = process.argv[4] || path.resolve("users.json");
const jsonData = require(filePath);

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
function compare(filter, element) {
  for (const key in filter) {
    if (typeof filter[key] === "object") {
      const result = compare(filter[key], element[key]);
      if (!result) return false;
    } else {
      if (!element[key].includes(filter[key])) return false;
    }
  }
  return true;
}
function research(filter, jsonData) {
  return jsonData.filter((element) => compare(filter, element));
}
const server = net.createServer((socket) => {
  console.log("Client has been connected");
  socket.setEncoding("utf8");
  socket.on("data", (data) => {
    try {
      const filter = JSON.parse(data);
      console.log(filter);
      validate(filter, jsonData[0]);

      const result = research(filter, jsonData).length
        ? JSON.stringify(research(filter, jsonData))
        : "Nothing was found";
      socket.end(result);
    } catch (err) {
      socket.end(`Inncorect request: ${err.message}`);
    }
  });
});

server.listen(PORT, ADDRESS, () => {
  console.log(` Server has started on port: ${PORT}, address: ${ADDRESS}`);
});
