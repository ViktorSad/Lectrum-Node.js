/* 
This example shows that we can use instances of Readable, Writable and Transform 
Also streams are async and using microtask queue

*/
const { Readable, Transform, Writable } = require("stream");
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
let customersDecrypted = [];

const ui = new Readable({
  objectMode: true,
  read() {
    const chunk = customers.shift();
    if (!chunk) return this.push(null);

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
      if (typeof field !== "string")
        throw new TypeError("Incorrect type of field");
    });

    this.push(chunk);
  },
});
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
const manager = new Writable({
  objectMode: true,
  write(chunk, encoding, callback) {
    customersDecrypted.push(chunk);
    callback();
  },
});

ui.on("error", (error) => {
  console.log(error.message);
})
  .pipe(decryptor)
  .pipe(manager)
  .on("finish", () => {
    console.log(customersDecrypted);
  });
for (let i = 0; i < 10; i++) {
  console.log("Hello world ", i);
}

setTimeout(() => {
  console.log("Timeout"), 0;
});
process.nextTick(() => {
  console.log("Next tick ---------------------");
});
