"use strict";
let fs = require('fs');

main();

function generateArrayWithRandomValues(size) {
    const result = [];

    while (size-- > 0) {
        result.push(Math.floor(Math.random() * size));
    }

    return result;
}

function saveDataAsJSONOnPath(data, output) {
    fs.writeFileSync(output, JSON.stringify({data: data}));
}

function main() {
    const size = parseInt(process.argv[3]);
    const output = process.argv[2];
    console.info(`Output path: ${output} size: ${size}`);

    const data = generateArrayWithRandomValues(size);
    saveDataAsJSONOnPath(data, output);
}
