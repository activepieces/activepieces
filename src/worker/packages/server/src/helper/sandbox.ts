const {execSync} = require("child_process");

export class Sandbox {

    constructor(
        public readonly boxId: number
    ) {
    }

    cleanAndInit(): void {
        Sandbox.runIsolate("--box-id=" + this.boxId + " --cleanup");
        Sandbox.runIsolate("--box-id=" + this.boxId + " --init");
    }

    executeFlow(args: string[]) {
        let metaFile = this.getSandboxFilePath("meta.txt");
        return Sandbox.runIsolate(
            "--dir=/usr/bin/ --dir=/etc/ --share-net --full-env --box-id=" + this.boxId +
            " --processes --wall-time=600 --meta=" + metaFile + " --stdout=__standardOutput.txt" +
            " --stderr=_standardError.txt --run /usr/bin/node activepieces-worker.js execute-flow");
    }

    getSandboxFilePath(subFile: string) {
        return this.getSandboxFolderPath() + subFile;
    }

    getSandboxFolderPath(): string {
        return "/var/local/lib/isolate/" + this.boxId + "/box"
    }

    private static runIsolate(cmd: string): string {
        return execSync("./resources/isolate " + cmd).toString('utf-8');
    }

}

const queue: number[] = [];
for (let boxId = 0; boxId < 20; ++boxId) {
    queue.push(boxId);
}

function obtainSandbox(): Sandbox {
    let sandboxId = queue.pop();
    return new Sandbox(sandboxId);
}

function returnSandbox(sandboxId: number) {
    queue.push(sandboxId);
}

export const sandboxManager = {
    obtainSandbox: obtainSandbox,
    returnSandbox: returnSandbox
}