/// <reference path="../../typescript-interfaces/node.d.ts" />
import {ReadStream, WriteStream} from "fs";
import {Server, ServerRequest, ServerResponse} from "http";
var http = require('http');
var fs = require('fs');
var formidable = require('formidable');


class StaticFormContainer {
    formContent:string;
    formContentByteLength:number;

    constructor(formFilePath:string, callback:Function) {
        this.formContent = '';
        this.loadForm(formFilePath, callback);
    }

    private loadForm(formFilePath:string, callback:Function) {
        var stream:ReadStream = fs.createReadStream(formFilePath);
        stream.on('data', (chunk)=> {
            this.formContent += chunk.toString()
        });
        stream.on('end', ()=> {
            this.formContentByteLength = Buffer.byteLength(this.formContent);
            callback();
        })
    }

    getContent():string {
        return this.formContent;
    }

    getContentLength():number {
        return this.formContentByteLength;
    }
}

class FileWriter {
    currentFileId:number;
    directoryForUploads:string = __dirname + '/uploaded';

    constructor() {
        this.currentFileId = 0;
    }

    getNewStream():WriteStream {
        var stream:WriteStream = fs.createWriteStream(this.createPathForNewFile())
        this.currentFileId += 1;
        return stream;
    }

    private createPathForNewFile():string {
        return `${this.directoryForUploads}/${this.currentFileId}`;
    }
}

class FileUploadServer {
    httpServer:Server;
    fileWriter:FileWriter;
    staticContainer:StaticFormContainer;

    constructor(port:number) {
        this.httpServer = http.createServer((req:ServerRequest, res:ServerResponse)=> {
            this.handleRequest(req, res);
        });
        this.fileWriter = new FileWriter();
        this.staticContainer = new StaticFormContainer(__dirname + '/form.html', ()=> {
            this.httpServer.listen(port, ()=> {
                console.log(`Server listening on port ${port}`);
            });
        });
    }

    handleRequest(req:ServerRequest, res:ServerResponse) {
        if (req.method === 'GET') {
            FileUploadServer.dispatchHttpResponse(res, 200, this.staticContainer.formContent);
        } else if (req.method === 'POST') {
            this.upload(req, res);
        } else {
            FileUploadServer.dispatchHttpResponse(res, 404, 'Not found');
        }
    };

    private static dispatchHttpResponse(res:ServerResponse, code:number, body:string) {
        res.statusCode = code;
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Length', Buffer.byteLength(body).toString());
        res.end(body);
    }

    private upload(req:ServerRequest, res:ServerResponse) {
        if (!FileUploadServer.isFormData(req)) {
            FileUploadServer.dispatchHttpResponse(res, 400, 'Bad request');
            return;
        }
        var form = new formidable.IncomingForm();

        form.on('progress', this.createNewProgressLoggingFunction(res));
        form.parse(req, () => {
            res.end('upload complete!');
        });
    }

    private createNewProgressLoggingFunction(res:ServerResponse) {
        return (bytesReceived:number, bytesExpected:number)=> {
            var percent = Math.floor(bytesReceived / bytesExpected * 100);
            console.log(`Upload progress: ${percent}`);
        }
    }

    private static isFormData(req:ServerRequest):boolean {
        var type = req.headers['content-type'] || '';
        return 0 == type.indexOf('multipart/form-data');
    }

}

var myServer = new FileUploadServer(3000);

