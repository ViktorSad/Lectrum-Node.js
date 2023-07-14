const { Readable, Writable, Transform, pipeline } = require("stream");
const {
  createCipheriv,
  createDecipheriv,
  randomFill,
  scrypt,
} = require("crypto");
const { promisify } = require("util");
const keyFn = promisify(scrypt);
const ivFn = promisify(randomFill);
//  Class Ui
class Ui extends Readable {
  constructor(customers, options = { objectMode: true }) {
    super(options);
    this.customers = customers;
    this.fields = new Set(["name", "email", "password"]);
    this.on("error", (error) => {
      console.error(error.message);
    });
  }
  _read() {
    const chunk = this.customers.shift();
    if (!chunk) return this.push(null);
    this._check(chunk);
    this.push(chunk);
  }

  _check(chunk) {
    // Convert Obj to Map
    const chunkMap = new Map(Object.entries(chunk));
    //  checking number of fields
    if (chunkMap.size !== this.fields.size)
      throw new TypeError("Incorrect number of fileds");
    // Checking name of fields
    chunkMap.forEach((value, key) => {
      if (!this.fields.has(key))
        throw new TypeError(`${chunk} doesnt have ${key} field `);
      //  checking type of values
      if (typeof value !== "string")
        throw new TypeError(
          ` This ${chunk}  has wrong  type of data ${value} `
        );
    });
  }
}
//  class Guardian

class Guardian extends Transform {
  constructor(data, options = { objectMode: true }) {
    super(options);
    this.algorithm = data.algorithm;
    this.key = data.key;
    this.iv = data.iv;
  }
  _transform(chunk, encoding, callback) {
    let { name, email, password } = chunk;
    // encrypring email
    const cipherivEmail = createCipheriv(this.algorithm, this.key, this.iv);
    let encrytedEmail = "";
    encrytedEmail = cipherivEmail.update(email, "utf8", "hex");
    encrytedEmail += cipherivEmail.final("hex");
    email = encrytedEmail;
    // encrypring password
    const cipherivPassword = createCipheriv(this.algorithm, this.key, this.iv);
    let encryptedPassword = "";
    encryptedPassword = cipherivPassword.update(password, "utf8", "hex");
    encryptedPassword += cipherivPassword.final("hex");
    password = encryptedPassword;
    const obj = { meat: "ui", payload: { name, email, password } };
    callback(null, obj);
  }
}
//  class AccountManager
class AccountManager extends Writable {
  constructor(data, options = { objectMode: true }) {
    super(options);
    this.algorithm = data.algorithm;
    this.key = data.key;
    this.iv = data.iv;
    this.clients = [];
    this.on("finish", () => {
      console.log("It's finished", this.clients);
    });
  }
  _write(chunk, encoding, callback) {
    let {
      payload: { email },
      payload: { password },
    } = chunk;
    //  decrypting email
    let decryptedEmail = "";
    const decipherEmail = createDecipheriv(this.algorithm, this.key, this.iv);
    decryptedEmail = decipherEmail.update(email, "hex", "utf8");
    decryptedEmail += decipherEmail.final("utf8");
    chunk.payload.email = decryptedEmail;
    // decrypting password
    let decryptedPassword = "";
    const decipherPassword = createDecipheriv(
      this.algorithm,
      this.key,
      this.iv
    );
    decryptedPassword = decipherPassword.update(password, "hex", "utf8");
    decryptedPassword += decipherPassword.final("utf8");
    chunk.payload.password = decryptedPassword;
    this.clients.push(chunk);
    callback();
  }
}
const customers = [
  {
    name: "Pitter Black",
    email: "pblack@email.com",
    password: "pblack_123",
  },
  { name: "Oliver White", email: "owhite@email.com", password: "owhite_456" },
];
(async function () {
  const algorithm = "aes-128-ctr";
  const password = "password-777";
  const key = await keyFn(password, "salt-777", 16);
  const iv = await ivFn(new Uint8Array(16));
  const ui = new Ui(customers);
  const guardian = new Guardian({ algorithm, key, iv });
  const manager = new AccountManager({ algorithm, key, iv });
  pipeline(ui, guardian, manager, (error) => {
    if (error) return console.log("Pipeline failed");
    console.log("Pipeline succeded");
  });
})();
