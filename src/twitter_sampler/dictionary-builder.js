"use strict";
var fs = require('fs');
var Transform = require('stream').Transform;
var byline = require('byline');


class FunctionStringTransformStream extends Transform {
    constructor(transformationFunction, options) {
        options = options || {};
        super(options);
        this.transformationFunction = transformationFunction;
    }

    _transform(chunk, encoding, callback) {
        let transformedChunk = this.transformationFunction(chunk);
        this.push(transformedChunk);
        callback();
    }
}


class DictionaryBuilder {
    constructor(sourcePath, destinationPath, transformStream) {
        this.sourcePath = sourcePath;
        this.destinationPath = destinationPath;
        this.transformStream = transformStream;
        this.streamEncoding = 'utf-8';
    }

    build(callback) {
        let writeStream = fs.createWriteStream(this.destinationPath, {encoding: this.streamEncoding});
        writeStream.write('{');
        let fileReadStream = byline(fs.createReadStream(this.sourcePath, {encoding: this.streamEncoding}));
        fileReadStream.pipe(this.transformStream, {end: false}).pipe(writeStream);
        fileReadStream.on('end', ()=> {
            this.transformStream.end('\n}', this.streamEncoding, callback);
        });
    }

}
function createTransformFunction(finishCharacter) {
    const endString = finishCharacter;
    let wroteLine = false;
    return (chunk) => {
        chunk = chunk.toString();
        if (chunk === endString) {
            return chunk;
        }
        const slittedChunk = chunk.split('\t');
        if (wroteLine) {
            return `,\n  "${slittedChunk[0]}" : ${slittedChunk[5]}`;
        }
        wroteLine = true;
        return `\n  "${slittedChunk[0]}" : ${slittedChunk[5]}`;
    }
}

const transformFromCSVToJsonLine = createTransformFunction('\n}');

let csvToJsonTransformStream = new FunctionStringTransformStream(transformFromCSVToJsonLine, {encoding: 'utf-8'});


let dictionaryBuilder = new DictionaryBuilder(
    './data/slownikWydzwieku01.csv',
    './data/polish-dictionary.json',
    csvToJsonTransformStream);

dictionaryBuilder.build();