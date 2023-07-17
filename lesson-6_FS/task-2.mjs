import * as fs from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import path from "path";
import os from "os";
//  The easiest way to read json file it's just add him as a module but this task asks us to use our knowleges of fs module
const inputFilePath = path.resolve("data", "comments.json");
const outputFilePath = path.resolve("data", "comments.csv");
const outputFilePath2 = path.resolve("data", "comments.gz");

class Json2Csv {
  constructor(inputFilePath, outputFilePath, customFields) {
    this.customFields = customFields;
    this.main(inputFilePath, outputFilePath);
  }
  async main(inputFilePath) {
    //  reading and parsing JSON file
    const jsonData = JSON.parse(await fs.readFile(inputFilePath, "utf8"));
    // Making header of CSV file
    let headerArray = this.fullListOfKeys(jsonData);
    //  cheking if we have filter
    headerArray = this.customFields || headerArray;
    const headerString = headerArray.join(";") + os.EOL;
    // Adding data rows
    const data = this.dataRows(headerArray, jsonData).join("");
    //    writing CSV file
    await fs.writeFile(outputFilePath, headerString + data, "utf8");
  }
  //  If our array has elements with  different keys we  will get  array of full (max) list of  keys
  fullListOfKeys(data) {
    return data.reduce((acc, next, index, arr) => {
      if (index !== arr.length) {
        const fields = Object.keys(next);
        fields.forEach((field) => {
          if (!acc.includes(field)) {
            acc.push(field);
          }
        });
      }
      return acc;
    }, []);
  }
  //    return array of data rows
  dataRows(headerArray, data) {
    return data.map((reccord) => {
      const dataRow =
        headerArray.reduce((acc, key) => {
          if (reccord[key]) {
            acc += String(reccord[key]).replace(/\n/g, "\\n") + ";";
          } else {
            acc += " ;";
          }
          return acc;
        }, "") + os.EOL;
      return dataRow;
    });
  }
}
const customFields = ["postId", "name", "body"];
const jsonTwoCsv = new Json2Csv(inputFilePath, outputFilePath, customFields);
