"use strict";
const { isBoolean, isNumber, isFunction, isString } = require("lodash");

//  Class TimerManager
class TimersManager {
  constructor() {
    this.timers = [];
    this.logs = [];
  }
  //   Methods of the class
  //  find MAX delay of the timers, , it will be initiated  after start method
  _maxDelay() {
    return this.timers
      .map((timer) => timer.delay)
      .reduce((prev, next) => Math.max(prev, next));
  }
  // Kill all timers , it will be initiated  after start method
  _killTimeouts() {
    this.timers
      .map((timer) => timer.name)
      .forEach((timerName) => this.remove(timerName));
  }
  // Validate before adding timer
  validate(timerObj) {
    const errors = [];
    //  checking name

    if (!isString(timerObj.name)) {
      errors.push("NAME: Wrong type or undefined or empty; ");
    }
    //   cheking delay
    if (!isNumber(timerObj.delay)) {
      errors.push("DELAY: wrong type or empty; ");
    }
    if (timerObj.delay < 0 || timerObj.delay > 5000) {
      errors.push("DELAY is <0 or >5000; ");
    }
    //  cheking Interval
    if (!isBoolean(timerObj.interval)) {
      errors.push("INTERWAL is absent or wrong type; ");
    }
    // checking job
    if (!isFunction(timerObj.job)) {
      errors.push("JOB is absent or wrong type; ");
    }
    if (this.timers.find((el) => el.name === timerObj.name))
      errors.push("This element is already exist; ");

    if (errors.length) {
      throw new Error(errors.reduce((acc, el) => acc + el));
    }
    this.isRinning();
    return null;
  }
  //  we can't add timer if it's started
  isRinning() {
    if (this.timers.length > 0) {
      const result = this.timers
        .map((el) => {
          return Boolean(el.intervalData) && !el.intervalData._destroyed;
        })
        .some((el) => el === true);
      if (result) {
        throw new Error(" Timers are runing");
      }
    }
    return null;
  }
  //   add method adding setTimeouts or setIntervals
  add(timer, ...arg) {
    this.validate(timer);
    const { name, delay, interval, job } = timer;

    // Function for timers
    //
    const setFn = () => {
      const newLog = {};
      try {
        newLog.name = name;
        newLog.in = [...arg];
        newLog.out = job(...arg);
      } catch (error) {
        newLog.out = undefined;
        const { name, message, stack } = error;
        newLog.error = { name, message, stack };
      } finally {
        newLog.created = new Date();
        this._log(newLog);
      }
    };
    const obj = {
      ...timer,
      setAction() {
        this.intervalData = interval
          ? setInterval(setFn, delay)
          : setTimeout(setFn, delay);
      },
      removeAction() {
        interval
          ? clearInterval(this.intervalData)
          : clearTimeout(this.intervalData);
      },
    };
    this.timers.push(obj);
    return this;
  }
  // method adds new log to logs
  _log(newLog) {
    this.logs.push(newLog);
  }
  //  remove method: removes setTimeout from array
  remove(timerName) {
    const currentTimer = this.timers.find((el) => el.name === timerName);
    if (currentTimer) {
      currentTimer.removeAction();
      const index = this.timers.indexOf(currentTimer);
      this.timers.splice(index, 1);
    }
  }
  //    method rum all setTimeouts
  start() {
    this.isRinning();
    this.timers.forEach((el) => {
      el.setAction();
    });
    //  As soon as it started all timers will be killed max_delay+10 sec
    setTimeout(() => {
      this._killTimeouts();
    }, this._maxDelay() + 10000);
  }
  //    stop all setTimeouts
  stop() {
    this.timers.forEach((el) => {
      el.removeAction();
    });
  }
  //    pause spesific timer
  pause(timerName) {
    const currentTimer = this.timers.find((el) => el.name === timerName);
    if (currentTimer) currentTimer.removeAction();
  }
  //  run spesific timer
  resume(timerName) {
    const currentTimer = this.timers.find((el) => el.name === timerName);
    if (currentTimer) currentTimer.setAction();
  }
  // print logs
  print() {
    console.log(this.logs);
  }
}
//  run the program
const manager = new TimersManager();
const t1 = {
  name: "t1",
  delay: 3000,
  interval: false,
  job: (a, b) => a + b,
};
const t2 = {
  name: "t2",
  delay: 2000,
  interval: false,
  job: () => {
    throw new Error("We have a problem!");
  },
};
const t3 = {
  name: "t3",
  delay: 5000,
  interval: false,
  job: (n) => n,
};
manager.add(t1, 1, 2);
manager.add(t2);
manager.add(t3, 1);
manager.start();
setTimeout(() => {
  manager.print();
}, 7000);
