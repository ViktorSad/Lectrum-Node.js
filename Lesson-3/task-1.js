const EventEmitter = require("events");
const { isString, isNumber } = require("lodash");

class Bank extends EventEmitter {
  #clients = [];
  constructor() {
    super();
    this.on("add", this.add);
    this.on("error", (error) => {
      error.name === "TypeError"
        ? console.error(error.message)
        : console.error(` Another kind of error ${error.name}`);
    });
    this.on("get", this.get);
    this.on("withdraw", this.withdraw);
  }
  register(client) {
    const { name, balance } = client;
    let id;
    try {
      if (!isString(name) || !isNumber(balance))
        throw new TypeError("Inccorect  user data");
      if (balance <= 0) throw new TypeError("Initial balance is 0 or less ");
      if (this.#clients.find((client) => client.name === name))
        throw new TypeError("This client already exist");
      id = this._idGenerator();
      this.#clients.push({ id, ...client });
      console.log("Client was added", this.#clients);
    } catch (error) {
      this.emit("error", error);
    } finally {
      return id || "was not added";
    }
  }
  _idGenerator() {
    return "id" + Math.random().toString(16).slice(2);
  }
  _validateTransaction(id, amount) {
    const currentClient = this.#clients.find((client) => client.id === id);
    if (!currentClient) throw new TypeError("Client was not found");
    if (amount <= 0) throw new TypeError("Amount<=0");
    return currentClient;
  }
  add(id, amount) {
    try {
      const currentClient = this._validateTransaction(id, amount);
      currentClient.balance += amount;
      console.log(currentClient);
    } catch (error) {
      this.emit("error", error);
    }
  }
  withdraw(id, amount) {
    try {
      const currentClient = this._validateTransaction(id, amount);
      if (currentClient.balance - amount < 0)
        throw new TypeError(
          " Can not withdraw more than you have on your account"
        );
      currentClient.balance -= amount;
      console.log("Withdraw was successful", currentClient);
    } catch (error) {
      this.emit("error", error);
    }
  }
  get(id, callback) {
    try {
      const currentClient = this._validateTransaction(id, 1);
      callback(currentClient.balance);
    } catch (error) {
      this.emit("error", error);
    }
  }
}

const bank = new Bank();
const personId = bank.register({
  name: "Pitter Black",
  balance: 100,
});

bank.emit("add", personId, 20);
bank.emit("get", personId, (balance) => {
  console.log(`I have ${balance}₴`); // I have 120₴
});
bank.emit("withdraw", personId, 15);
bank.emit("get", personId, (balance) => {
  console.log(`I have ${balance}₴`); // I have 70₴
});
