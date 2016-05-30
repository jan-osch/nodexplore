"use strict";

const _ = require('lodash');
const utils = require('./utils');
const fs = require('fs');

function loadInputData(path) {
    return (JSON.parse(fs.readFileSync(path))).data;
}

function main(){
  const inputData = utils.timeAndLog(()=>loadInputData(process.argv[2]), 'main - loading input data');
  const result = utils.timeAndLog(()=>_.sortBy(inputData), 'main -soriting the data');
}

main();
