"use strict";
let DictionaryBuilder = require('./dictionary-builder');


function createTransformStreamFunction(separator, finishString) {
    let wroteLine = false;
    return (chunk)=> {
        chunk = chunk.toString();
        if (chunk === finishString) {
            return chunk;
        }
        const separatedChunk = chunk.split(separator);
        if (wroteLine) {
            return `,\n   "${separatedChunk[1].toLowerCase()}" : "${separatedChunk[0].toLowerCase()}"`
        }
        wroteLine = true;
        return `\n   "${separatedChunk[1].toLowerCase()}" : "${separatedChunk[0].toLowerCase()}"`
    }
}

let separatorFunction = createTransformStreamFunction(';', "\n}");

let separateAndExtractLematTransformStream = new DictionaryBuilder.FunctionStringTransformStream(separatorFunction, {encoding: 'utf-8'});

let polishLemmatizerBuilder = new DictionaryBuilder.StreamJsonBuilder(
    './data/polimorfologik-2.1.txt',
    './data/polish-lematizer.json',
    separateAndExtractLematTransformStream
);

polishLemmatizerBuilder.build();