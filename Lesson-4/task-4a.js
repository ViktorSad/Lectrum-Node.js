const { Readable, Transform, Writable, pipeline } = require("stream");
const customers = [
  {
    payload: {
      name: "Pitter Black",
      email: "70626c61636b40656d61696c2e636f6d",
      password: "70626c61636b5f313233",
    },
    meta: {
      algorithm: "hex",
    },
  },
  {
    payload: {
      name: "Viktor Black",
      email: "70626c61636b40656d616c2e636f6d",
      password: "70626c61636b313233",
    },
    meta: {
      algorithm: "hex",
    },
  },
];

class Ui extends Readable {
  constructor(customers, options = { objectMode: true }) {
    super(options);
    this.customers = customers;
    this.on("error", (error) => {
      error.name === "TypeError"
        ? console.log(error.message)
        : console.log("Another erorr", error.message);
    });
  }
  _check(chunk) {
    if (!Object.hasOwn(chunk, "payload") || !Object.hasOwn(chunk, "meta"))
      throw new TypeError(" No payload or meta fields");
    if (
      !Object.hasOwn(chunk.payload, "name") ||
      !Object.hasOwn(chunk.payload, "email") ||
      !Object.hasOwn(chunk.payload, "password")
    )
      throw new TypeError(" No name, email or password fields");
    if (!Object.hasOwn(chunk.meta, "algorithm"))
      throw new TypeError("No algoritthm field");

    if (!new Set(["hex", "base64"]).has(chunk.meta.algorithm))
      throw new TypeError("Incorrect algorithm");
    Object.values(chunk.payload).forEach((field) => {
      if (typeof field !== "string" || field === "")
        throw new TypeError("Incorrect type of field");
    });
  }
  _read() {
    const chunk = this.customers.shift();
    if (!chunk) return this.push(null);
    this._check(chunk);
    this.push(chunk);
  }
}

const decryptor = new Transform({
  objectMode: true,
  transform(chunk, encoding, callback) {
    const {
      meta: { algorithm },
      payload: { name, email: encodedEmail, password: encodedPassword },
    } = chunk;
    const email = Buffer.from(encodedEmail, algorithm).toString();
    const password = Buffer.from(encodedPassword, algorithm).toString();
    callback(null, { name, email, password });
  },
});

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
    callback();
  }
}
const ui = new Ui(customers);
const manager = new AccountManager();
pipeline(ui, decryptor, manager, (error) => {
  if (error) return console.log("Pipeline is failed");
  console.log("Pipeline succeded");
});
