// Initional const
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
//  import packages
const { Readable, Writable, Transform, pipeline } = require("stream");
const EventEmitter = require("events");
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

    console.log("everything is good");
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
// Guardian Transform stream
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
    //  You can do this.push(obj) and then callback()
    //  or you can just do callback(null, obj) - first argument is error therefore here is null
    //  but you can do try{} catch {} and pass error if you want to catch error
    callback(null, obj);
  }
  //    this will be called when it's done
  _flush(callback) {
    console.log(" Transformation is over");
    callback();
  }
}

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
  //
  _writev(chunks, callback) {
    this.database.push(chunks);
    callback();
  }
}

class Logger extends Transform {
  constructor(options = { objectMode: true }) {
    super(options);
    this.dbase = new DB();
  }
  _transform(chunk, encoding, callback) {
    const {
      meta: { source },
      payload,
    } = chunk;
    const obj = {
      source,
      payload,
      created: new Date(),
    };
    //  In this case we use this.push(chunk) and callback() - it's another way to transfer data
    this.dbase.emit("add", obj);
    this.push(chunk);
    callback();
  }
  //   this will be called before event "finish", This this usefull if you need to do something before the stream will be over
  _flush(callback) {
    console.log("Logger file:", this.dbase.logerData);
    callback();
  }
}
class DB extends EventEmitter {
  constructor() {
    super();
    this.logerData = [];
    this.on("add", this.add);
  }
  add(chunk) {
    this.logerData.push(chunk);
  }
}

const ui = new Ui(customers);

const logger = new Logger();
const guardian = new Guardian();
const manager = new AccountManager();

//    using pipeline
pipeline(
  ui,
  //  just an example to show that you can use events in pipelines but be carefull to use it
  guardian.on("data", () => process.stdout.write("----- \n")),
  logger,
  manager,
  //  the last is function to catch the error
  (error) => {
    if (error) return console.log("Pipeline is failed");
    console.log("Pipeline succeeded");
  }
);
