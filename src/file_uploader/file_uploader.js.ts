/// <reference path="../../typescript-interfaces/node.d.ts" />
import {ReadStream} from "fs";
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

class FileContainer {
    currentFileId:number;
    directoryForUploads:string = __dirname + '/uploaded';
    fileMap:Array<string>;

    constructor() {
        this.currentFileId = 0;
        this.fileMap = [];
    }

    getIdForNewFile(name:string):number {
        this.fileMap[this.currentFileId] = `${this.directoryForUploads}/${name}`;
        return this.currentFileId++;
    }

    getPathForId(id:number):string {
        if (!this.isIdInContainer(id)) {
            throw new Error('invalid id');
        }
        return this.fileMap[id];
    }

    isIdInContainer(id:number):boolean {
        return id < this.fileMap.length && id >= 0;
    }

    getReadStreamForId(id:number):ReadStream {
        return fs.createReadStream(this.getPathForId(id));
    }
}

class FileUploadServer {
    httpServer:Server;
    fileContainer:FileContainer;
    staticContainer:StaticFormContainer;

    constructor(port:number) {
        this.httpServer = http.createServer((req:ServerRequest, res:ServerResponse)=> {
            this.handleRequest(req, res);
        });
        this.fileContainer = new FileContainer();
        this.staticContainer = new StaticFormContainer(__dirname + '/form.html', ()=> {
            this.httpServer.listen(port, ()=> {
                console.log(`Server listening on port ${port}`);
            });
        });
    }

    handleRequest(req:ServerRequest, res:ServerResponse) {
        if (req.method === 'GET') {
            if (FileUploadServer.isFileRequest(req)) {
                this.attemptToServeFile(req, res);
                return;
            }
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
        this.handleFileUploadForm(req, res);
    }

    private attemptToServeFile(req:ServerRequest, res:ServerResponse) {
        var id = parseInt(req.url.slice(1));
        if (!this.fileContainer.isIdInContainer(id)) {
            FileUploadServer.dispatchHttpResponse(res, 404, 'Not found');
            return;
        }
        this.fileContainer.getReadStreamForId(id).pipe(res);
    }

    private handleFileUploadForm(req:ServerRequest, res:ServerResponse) {
        var form = new formidable.IncomingForm();
        var fileId:number;
        form.on('progress', this.createNewProgressLoggingFunction(res));
        form.on('fileBegin', (name, file)=> {
            fileId = this.fileContainer.getIdForNewFile(file.name);
            file.path = this.fileContainer.getPathForId(fileId);
        });
        form.parse(req, () => {
            res.end(`upload complete! stored as: ${fileId}`);
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

    private static isFileRequest(req:ServerRequest):boolean {
        return req.url != '/';
    }
}

var myServer = new FileUploadServer(3000);

