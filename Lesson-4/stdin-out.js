const readline = require("readline");

// // Create an interface for reading input
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout,
// });

// // Define your questions as an array
// const questions = [
//   "What is your name?",
//   "Where are you from?",
//   "What is your favorite color?",
// ];
// let answers=[]

// // Function to ask the questions recursively
// function askQuestion(index) {
//   if (index === questions.length) {
//     // All questions have been answered
//     rl.close();
//     return;
//   }

//   rl.question(questions[index] + " ", (answer) => {
//     console.log(`You answered: ${answer}`);
//     askQuestion(index + 1);
//   });
// }

// // Start asking the questions
// askQuestion(0);
const questions = [
  "What is your name?",
  "Where are you from?",
  "What is your favorite color?",
];
let answers = [];

class Questinary {
  constructor(questions) {
    this.questions = questions;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.answers = [];
    this.askQuestion(0);
  }
  askQuestion(index) {
    if (index === this.questions.length) {
      // All questions have been answered
      console.log("Thank you ");
      console.log(this.answers);
      this.rl.close();
      return;
    }

    this.rl.question(this.questions[index] + " ", (answer) => {
      console.log(`You answered: ${answer}`);
      this.answers.push(answer);
      this.askQuestion(index + 1);
    });
  }
}
const questionary = new Questinary(questions);
