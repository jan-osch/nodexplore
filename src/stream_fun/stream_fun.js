"use strict";

let fs = require('fs');
let Stream = require('stream');

let filePaths = ['./h.txt', './s.txt'];

class StreamProcessor {

    constructor() {
        this.process_streams = [];
    }

    push(source_stream) {
        // Create a new Transform Stream
        let transform = new StreamTransformer();
        // Register the finish event and then pipe
        transform.processed = transform.wait.call(transform);
        source_stream.pipe(transform);
        // push the stream to the internal array
        this.process_streams.push(transform);
    }

    done(callback) {
        let streams = this.process_streams;
        // Wait for all Transform streams to finish processing
        Promise.all(
            streams.map(function (s) {
                return s.processed;
            }))
            .then(function () {
                let combined_stream = new Stream.PassThrough();
                streams.forEach(function (stream) {
                    stream.pipe(combined_stream);
                });

                // Call the callback with stream or error
                callback(null, combined_stream);
            })
            .catch(function (err) {
                callback(err);
            });
    }

}

class StreamTransformer extends Stream.Transform {

    constructor() {
        // call super
        super();
    }

    _transform(chunk, enc, transformed) {
        // process files here 
        let data = chunk.toString();
        data = data.substring(0, data.length - 2);
        this.push(data);
        transformed();
    }

    _flush(flushed) {
        // for additonal at end
        this.push('\n');
        flushed();
    }

    wait() {
        // returns a promise that resolves, when all the data is processed;
        let stream = this;

        return new Promise(function (resolve, reject) {
            stream.on('finish', function () {
                resolve(true);
            });
            stream.on('error', function (err) {
                reject(err);
            });
        });

    }

}

///  Now simply  

let process_stream = new StreamProcessor();

filePaths.forEach(function (fpath) {
    let fstream = fs.createReadStream(fpath);
    process_stream.push(fstream);
});

process_stream.done(function
    (err, combined_stream) {
    // Consume the combines stream
    combined_stream.pipe(process.stdout);
});