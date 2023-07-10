const EventEmitter = require("events");
const { isString, isNumber, isFunction } = require("lodash");

class Bank extends EventEmitter {
  #clients = [];
  constructor() {
    super();
    //  Events
    this.on("add", this.add);
    this.on("get", this.get);
    this.on("withdraw", this.withdraw);
    this.on("send", this.send);
    this.on("changeLimit", this.changeLimit);
    this.on("error", (error) => {
      error.name === "TypeError"
        ? console.error(error.message)
        : console.error(` Another kind of error ${error}`);
    });
  }
  // Methods
  //  register clients
  register(client) {
    const { name, balance, limit } = client;
    let id;
    try {
      console.log(limit);
      if (!isString(name) || !isNumber(balance) || isFunction([limit]))
        throw new TypeError("Inccorect  user data");
      this._validateAmount(balance);
      if (this.#clients.find((client) => client.name === name))
        throw new TypeError(`${name}  is already exist`);
      id = this._idGenerator();
      this.#clients.push({ id, name, balance, limit });
      console.log("Client was added", { id, ...client });
    } catch (error) {
      this.emit("error", error);
    } finally {
      return id || "was not added";
    }
  }
  //   Generator of id got it from StackOverflow :)
  _idGenerator() {
    return "id" + Math.random().toString(16).slice(2);
  }
  //   Checking  clients ID
  _validateClient(id) {
    const currentClient = this.#clients.find((client) => client.id === id);
    if (!currentClient) throw new TypeError(`Client with  ${id} was not found`);
    return currentClient;
  }
  //   Checking amount
  _validateAmount(amount) {
    if (amount <= 0) throw new TypeError("Amount<=0");
  }
  //    Add money to client's account
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
  //   Check if balance will be positive after withdrawing money
  _isBalanceOk(client, amount) {
    const updatedBalance = client.balance - amount;
    if (updatedBalance < 0)
      throw new TypeError(
        ` Client: '${client.name}' can not withdraw more than he has on his account`
      );
    return updatedBalance;
  }
  //   Send money from one client to another
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

  //    withdraw money from account
  withdraw(id, amount) {
    try {
      const currentClient = this._validateClient(id);
      this._validateAmount(amount);
      const updatedBalance = this._isBalanceOk(currentClient, amount);
      const isLimitOk = currentClient.limit(
        amount,
        currentClient.balance,
        updatedBalance
      );
      if (!isLimitOk)
        throw new TypeError(
          ` ${currentClient.name}: limits don't allow you to withdraw money`
        );
      currentClient.balance = updatedBalance;
      console.log("Withdraw was successful ", currentClient);
    } catch (error) {
      error.message = "Withdraw WAS NOT successful " + error.message;
      this.emit("error", error);
    }
  }
  //   Change limit
  changeLimit(clientId, limit) {
    try {
      const currentClient = this._validateClient(clientId);
      currentClient.limit = limit;
    } catch (error) {
      this.emit("error", error);
    }
  }
  //   Get balance of the client
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
const personId = bank.register({
  name: "Oliver White",
  balance: 800,
  limit: (amount) => amount < 10,
});
bank.emit("withdraw", personId, 15);
bank.emit("get", personId, (amount) => {
  console.log(`I have ${amount}₴`); // I have 695₴
});
// // Case 1
bank.emit("changeLimit", personId, (amount, currentBalance, updatedBalance) => {
  return amount < 100 && updatedBalance > 700;
});
bank.emit("withdraw", personId, 5); // Error
// // Case 2
bank.emit("changeLimit", personId, (amount, currentBalance, updatedBalance) => {
  return amount < 100 && updatedBalance > 700 && currentBalance > 800;
});
// // Case 3
bank.emit("changeLimit", personId, (amount, currentBalance) => {
  return currentBalance > 800;
});
// // Case 4
bank.emit("changeLimit", personId, (amount, currentBalance, updatedBalance) => {
  return updatedBalance > 900;
});
