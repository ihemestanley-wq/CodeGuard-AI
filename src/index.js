const { analyzePR } = require("./agent/analyzer");
const fs = require("fs");

const diff = fs.readFileSync("./examples/sample.diff", "utf-8");

const result = analyzePR(diff);
console.log(result);

// Made with Bob
