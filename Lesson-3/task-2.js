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
    this.on("send", this.send);
  }
  register(client) {
    const { name, balance } = client;
    let id;
    try {
      if (!isString(name) || !isNumber(balance))
        throw new TypeError("Inccorect  user data");
      this._validateAmount(balance);
      if (this.#clients.find((client) => client.name === name))
        throw new TypeError("This client already exist");
      id = this._idGenerator();
      this.#clients.push({ id, ...client });
      console.log("Client was added", { id, ...client });
    } catch (error) {
      this.emit("error", error);
    } finally {
      return id || "was not added";
    }
  }
  _idGenerator() {
    return "id" + Math.random().toString(16).slice(2);
  }
  _validateClient(id) {
    const currentClient = this.#clients.find((client) => client.id === id);
    if (!currentClient) throw new TypeError(`Client with  ${id} was not found`);
    return currentClient;
  }
  _validateAmount(amount) {
    if (amount <= 0) throw new TypeError("Amount<=0");
  }
  add(id, amount) {
    try {
      const currentClient = this._validateClient(id);
      this._validateAmount(amount);
      currentClient.balance += amount;
      console.log(currentClient);
    } catch (error) {
      this.emit("error", error);
    }
  }
  _isBalanceOk(client, amount) {
    if (client.balance - amount < 0)
      throw new TypeError(
        ` Client: '${client.name}' can not withdraw more than he has on his account`
      );
  }
  send(senderId, receiverId, amount) {
    try {
      const sender = this._validateClient(senderId);
      this._validateClient(receiverId);
      this._validateAmount(amount);
      this._isBalanceOk(sender, amount);
      this.withdraw(senderId, amount);
      this.add(receiverId, amount);
    } catch (error) {
      error.message = "Wire transaction is not successfull" + error.message;
      this.emit("error", error);
    }
  }
  withdraw(id, amount) {
    try {
      const currentClient = this._validateClient(id);
      this._validateAmount(amount);
      this._isBalanceOk(currentClient, amount);
      currentClient.balance -= amount;
      console.log("Withdraw was successful", currentClient);
    } catch (error) {
      this.emit("error", error);
    }
  }
  get(id, callback) {
    try {
      const currentClient = this._validateClient(id);
      callback(currentClient.balance);
    } catch (error) {
      this.emit("error", error);
    }
  }
}
const bank = new Bank();
const personFirstId = bank.register({
  name: "Pitter Black",
  balance: 100,
});
const personSecondId = bank.register({
  name: "Oliver White",
  balance: 700,
});
bank.emit("send", personFirstId, personSecondId, 50);
bank.emit("get", personSecondId, (balance) => {
  console.log(`I have ${balance}₴`); // I have 750₴
});
