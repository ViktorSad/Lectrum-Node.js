const customers = [
  {
    name: "Pitter Black",
    email: "pblack@email.com",
    password: "pblack_123",
  },
  {
    name: "Oliver White",
    email: "owhite@email.com",
    password: "owhite_456",
  },
];

const { Readable, Writable, Transform } = require("stream");
//  Classs Ui extends readable
class Ui extends Readable {
  constructor(array, options = { objectMode: true }) {
    super(options);
    this.array = array;
    this.on("error", (error) => {
      if (error.name === "TypeError") return console.log(error.message);
      console.log("Another error", error);
    });
  }
  _check(chunk) {
    const obligatedFields = new Set(["name", "email", "password"]);

    const fieldSet = Object.keys(chunk);

    if (fieldSet.length !== obligatedFields.size)
      throw new TypeError(" Incorrect number of fields");
    for (const field of fieldSet) {
      if (!obligatedFields.has(field))
        throw new TypeError(`Incoorect field  ${field} `);
    }
  }
  _read() {
    const data = this.array.shift();

    if (!data) {
      this.push(null);
    } else {
      this._check(data);
      this.push(data);
    }
  }
}
// Class Guardian
class Guardian extends Transform {
  constructor(options = { objectMode: true }) {
    super(options);
  }
  _transform(chunk, encoding, callback) {
    const obj = {
      meta: { source: "ui" },
      payload: {
        name: chunk.name,
        email: Buffer.from(chunk.email).toString("hex"),
        password: Buffer.from(chunk.password).toString("hex"),
      },
    };
    callback(null, obj);
  }
  _flush(callback) {
    console.log(" Transformation is over");
    callback();
  }
}
//  class AccountManager
class AccountManager extends Writable {
  constructor(options = { objectMode: true }) {
    super(options);
    this.database = [];
    this.on("finish", () => {
      console.log("It's done here is database:");
      console.log(this.database);
    });
  }
  _write(chunk, encoding, callback) {
    this.database.push(chunk);
    console.log("Received: ", chunk.payload);
    callback();
  }
  _writev(chunks, callback) {
    this.database.push(chunks);
    callback();
  }
}

const ui = new Ui(customers);
const guardian = new Guardian();
const manager = new AccountManager();
ui.pipe(guardian).pipe(manager);
