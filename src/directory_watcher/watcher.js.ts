/// <reference path="./node.d.ts" />
import events = require('events');
import fs = require('fs');
import path  = require('path');
import ErrnoException = NodeJS.ErrnoException;
import WritableStream = NodeJS.WritableStream;

var checkError = (err?:ErrnoException)=> {
    if (err) {
        throw err;
    }
};


class FileWatcher extends events.EventEmitter {
    private pathToWatch:string;
    private pathToOutPut:string;
    private fileTrackingClosure:(string)=>boolean;
    private fileWatchingOptions:Object = {persistent: true, interval: 500};

    constructor(pathToWatch:string, pathOutput:string) {
        super();
        this.pathToWatch = pathToWatch;
        this.pathToOutPut = pathOutput;
        this.fileTrackingClosure = this.createTrackingClosure();
        this.initializeListeners();
    }

    private createTrackingClosure() {
        var alreadyWatching:Array<string> = [];
        return (fileName)=> {
            if (alreadyWatching.indexOf(fileName) === -1) {
                alreadyWatching.push(fileName);
                return true;
            }
            console.log(`${fileName} has already been watched`);
            return false;
        }
    }

    private initializeListeners() {
        this.on('startWatching', (fileName:string)=> {
            this.watchFile(fileName);
        });
    }

    watchDirectory() {
        this.logStartWatching(this.pathToWatch);
        this.scanDirectory();
        fs.watch(this.pathToWatch, this.fileWatchingOptions, ()=> {
            this.logChanged(this.pathToWatch);
            this.scanDirectory();
        });
    }

    scanDirectory() {
        fs.readdir(this.pathToWatch, (err:ErrnoException, fileList:Array<string>)=> {
            checkError(err);
            fileList.forEach((fileName)=> {
                if (this.fileTrackingClosure(fileName)) {
                    this.emit('startWatching', fileName);
                }
            });
        });
    }

    private watchFile(fileName:string) {
        var fileWithPath = path.join(this.pathToWatch, fileName);
        this.logStartWatching(fileWithPath);
        fs.watch(fileWithPath, this.fileWatchingOptions, ()=> {
            this.logChanged(fileName);
            this.copyFileAndChangeNameToLowercase(fileName);
        })
    }

    private copyFileAndChangeNameToLowercase(fileName:string) {
        var sourceFileName:string = path.join(this.pathToWatch, fileName);
        var destinationFileName:string = path.join(this.pathToOutPut, fileName.toLowerCase());
        fs.createReadStream(sourceFileName).pipe(fs.createWriteStream(destinationFileName));
    }

    private logStartWatching(fileName:string) {
        console.log(`starting to watch ${fileName}`);
    }

    private logChanged(fileName:string) {
        console.log(`${fileName} has been changed`);
    }
}

var watcher:FileWatcher = new FileWatcher('./in', './out');

watcher.watchDirectory();