/// <reference path="../../typescript-interfaces/node.d.ts" />
import {Server, ServerRequest, ServerResponse, ClientResponse, ClientRequest} from "http";
var http = require('http');


var myServer:Server = http.createServer(handleRequests);

function traceErrorIfPresent(err:Error) {
    if (err) {
        console.error(err);
    }
}

function handleRequests(request:ServerRequest, response:ServerResponse) {
    console.log(request.headers);
    let requestBody:string = '';

    request.on('data', (chunk)=> {
        console.log(`chunk recived`);
        requestBody += chunk;
    });
    request.on('end', ()=> {
        console.log(requestBody);
    });
    request.on('error', traceErrorIfPresent);

    response.statusCode = 200;
    response.end('Hello Mother-father');
}

myServer.listen(3000);


function runPostRequest(host:string, path:string, body:string, callback:(ClientResponse)=>void) {
    const options = {
        hostname: host,
        port: 3000,
        path: path,
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(body)
        }
    };
    let request:ClientRequest = http.request(options, callback);
    request.on('error', traceErrorIfPresent);
    var splittedBody:Array<string> = body.split('');
    while (splittedBody.length > 0) {
        request.write(splittedBody.splice(0, 15).join(''));
    }
    request.end();
}

function handleRequestSend(response:ClientResponse) {
    console.log(`STATUS: ${response.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(response.headers)}`);
    response.setEncoding('utf8');
    response.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
    response.on('end', () => {
        console.log('No more data in response.');
        myServer.close();
    });
    response.on('error', traceErrorIfPresent);
}

function createLongText(length):string {
    var longText:string = '';
    for (var i = 0; i < length; i++) {
        longText += 'longtext';
    }
    return longText
}

runPostRequest('localhost', '/', createLongText(100), handleRequestSend);