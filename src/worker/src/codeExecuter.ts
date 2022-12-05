import * as unzip from 'unzip-stream';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import {execSync} from "child_process";
//import sudo from 'exec-root';


const codeWrapperFile:string = './resources/code-wrapper.js';

export class CodeExecutor {
    artifactFilePath: string;
    artifactName: string;

    constructor(artifactFilePath : string, artifactName: string) {
        this.artifactFilePath = artifactFilePath;
        this.artifactName = artifactName;
    }

    prepareExecution() {

        // unzip artifact file
    // let reader=   fs.createReadStream(this.getFilePath(this.artifactFilePath, this.artifactName)).pipe(unzip.Extract({ path: this.artifactFilePath }));
        //copy code-wrapper.js to artifact dir
       // fs.copyFileSync(codeWrapperFile,this.getFilePath(this.artifactFilePath, 'code-wrapper.js'));
   //     fse.copySync(this.artifactFilePath, "/var/local/lib/isolate/0/box",{ overwrite: true })
    }
    //
     async executeCode() {
         //let command = "/home/shahed/Downloads/isolate --dir=/usr/bin/ --dir=/etc/ --share-net --full-env --box-id=0 --processes --stdout='_standardOutput.txt' --run /usr/bin/node code-wrapper.js "

         //const stdout = await sudo.exec(command)
         const stdout = execSync('/bin/bash -c pwd').toString();
         //   const stdout = execSync('/bin/bash -c' + this.getFilePath(this.artifactFilePath, 'code-wrapper.js')).toString();
         return stdout;
     }
    //
    getFilePath(dir:string, fileName: string) {
        return dir + '/' + fileName;
    }
}