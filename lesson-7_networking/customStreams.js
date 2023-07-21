const { Transform } = require("stream");
const os = require("os");
//  Transform stream witch filter specific data from array of objects
class Research extends Transform {
  constructor(filter, options = { objectMode: true }) {
    super(options);
    this.filter = filter;
  }
  _transform(chunk, encoding, callback) {
    if (this.compare(this.filter, chunk)) {
      this.push(JSON.stringify(chunk));
    }
    callback();
  }
  compare(filter, element) {
    for (const key in filter) {
      if (typeof this.filter[key] === "object") {
        const result = this.compare(filter[key], element[key]);
        if (!result) return false;
      } else {
        if (!element[key].includes(filter[key])) return false;
      }
    }
    return true;
  }
}
// Transfrom stream witch conver JSON data to CSV format
class Json2Csv extends Transform {
  constructor(options = { encoding: "utf8" }) {
    super(options);
    this.headerWasWritten = false;
  }
  _transform(chunk, encoding, callback) {
    chunk = JSON.parse(chunk);
    if (!this.headerWasWritten) {
      const header = Object.keys(chunk).join(";") + os.EOL;
      this.push(header);
      this.headerWasWritten = true;
    }
    const line = Object.values(chunk).join(";") + os.EOL;
    this.push(line);
    callback();
  }
}

module.exports = { Research, Json2Csv };
