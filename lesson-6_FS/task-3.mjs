import * as fs from "fs/promises";
import { createReadStream, createWriteStream } from "fs";
import path from "path";
import os from "os";
import zlib from "zlib";
import { pipeline } from "stream";
//  The easiest way to read json file it's just add him as a module but this task asks us to use our knowleges of fs module

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

class Archiver {
  constructor(inputFilePath) {
    this.inputFilePath = inputFilePath;
    this.outputArchivePath = "";
  }
  zip() {
    const outPutObject = path.parse(this.inputFilePath);
    const filename = path.basename(this.inputFilePath) + ".gz";
    outPutObject.base = filename;
    this.outputArchivePath = path.format(outPutObject);
    const readStream = createReadStream(this.inputFilePath);
    const compressStream = zlib.createGzip();
    const writeStream = createWriteStream(this.outputArchivePath);
    pipeline(readStream, compressStream, writeStream, (error) => {
      if (error) return console.log("Pipeline is failed", error);
      console.log("Pipeline is succeded");
    });
  }
  unzip() {
    if (this.outputArchivePath === "") return;
    const readStream = createReadStream(this.outputArchivePath);
    const compressStream = zlib.createGunzip();
    const parsedfilePath = path.parse(this.inputFilePath);
    const unzipedFileName = {
      dir: parsedfilePath.dir,
      name: parsedfilePath.name + "UNZIPED",
      ext: parsedfilePath.ext,
    };
    const unzipedFileStr = path.format(unzipedFileName);
    const writeStream = createWriteStream(unzipedFileStr);
    pipeline(readStream, compressStream, writeStream, (error) => {
      if (error) return console.log("Pipeline is failed", error);
      console.log("Pipeline is succeded");
    });
  }
}

const inputFilePath = path.resolve("data", "comments.json");
const outputFilePath = path.resolve("data", "comments.csv");
const customFields = ["postId", "name", "body"];

const jsonTwoCsv = new Json2Csv(inputFilePath, outputFilePath, customFields);
const archiver = new Archiver(outputFilePath);
//  watcher of the procees in directory
const abortC = new AbortController();
const { signal } = abortC;
const watcher = fs.watch(path.resolve(), {
  recursive: true,
  signal,
});
try {
  for await (const event of watcher) {
    if (path.basename(event.filename) === path.basename(outputFilePath)) {
      console.log("Cached event", event);
      archiver.zip(); // Make a zip
    }
    if (
      path.basename(event.filename) ===
      path.basename(archiver.outputArchivePath)
    ) {
      console.log("Catched event", event);
      archiver.unzip(); // unzip file
      abortC.abort();
    }
  }
} catch (error) {
  if (!error.name === "AbortError") {
    console.log(error);
  }
}
