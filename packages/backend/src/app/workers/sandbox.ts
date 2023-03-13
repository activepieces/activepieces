import { arch, cwd } from "node:process";
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { system } from "../helper/system/system";
import { SystemProp } from "../helper/system/system-prop";
import { logger } from "../helper/logger";
import { packageManager } from "../helper/package-manager";

const getIsolateExecutableName = () => {
    const defaultName = "isolate";
    const executableNameMap: Record<string, string> = {
        "arm": "isolate-arm",
        "arm64": "isolate-arm",
    };
    return executableNameMap[arch] ?? defaultName;
};

const TWO_MINUTES = 120;

export class Sandbox {
    private static readonly isolateExecutableName = getIsolateExecutableName();
    private static readonly sandboxRunTimeSeconds = system.getNumber(SystemProp.SANDBOX_RUN_TIME_SECONDS) ?? TWO_MINUTES;

    constructor(public readonly boxId: number) {}

    async cleanAndInit(): Promise<void> {
        await Sandbox.runIsolate("--box-id=" + this.boxId + " --cleanup");
        await Sandbox.runIsolate("--box-id=" + this.boxId + " --init");
        await packageManager.initProject(this.getSandboxFolderPath());
    }

    async runCommandLine(commandLine: string): Promise<string> {
        const metaFile = this.getSandboxFilePath("meta.txt");
        const etcDir = path.resolve("./packages/backend/src/assets/etc/");

        return await Sandbox.runIsolate(
            `--dir=/usr/bin/ --dir=/etc/=${etcDir} --share-net --box-id=` +
        this.boxId +
        ` --processes --wall-time=${Sandbox.sandboxRunTimeSeconds} --meta=` +
        metaFile +
        " --stdout=_standardOutput.txt" +
        " --stderr=_standardError.txt --run " +
        " --env=AP_ENVIRONMENT " +
        commandLine
        );
    }

    parseFunctionOutput(): string | undefined {
        const outputFile = this.getSandboxFilePath("_functionOutput.txt");
        if (!fs.existsSync(outputFile)) {
            return undefined;
        }
        const str = fs.readFileSync(outputFile).toString("utf-8");
        if (this.isJson(str)) {
            return JSON.parse(str);
        }
        return str;
    }

    parseStandardOutput(): string {
        return fs.readFileSync(this.getSandboxFilePath("_standardOutput.txt")).toString("utf-8");
    }

    parseStandardError(): string {
        return fs.readFileSync(this.getSandboxFilePath("_standardError.txt")).toString("utf-8");
    }

    parseMetaFile(): Record<string, unknown> {
        const metaFile = this.getSandboxFilePath("meta.txt");
        const lines = fs.readFileSync(metaFile).toString("utf-8").split("\n");
        const result: Record<string, unknown> = {};

        lines.forEach((line: string) => {
            const parts = line.split(":");
            result[parts[0]] = parts[1];
        });
        return result;
    }

    timedOut(): boolean {
        const meta = this.parseMetaFile();
        return meta["status"] === "TO";
    }

    getSandboxFilePath(subFile: string) {
        return this.getSandboxFolderPath() + "/" + subFile;
    }

    getSandboxFolderPath(): string {
        return "/var/local/lib/isolate/" + this.boxId + "/box";
    }

    private static runIsolate(cmd: string): Promise<string> {
        const currentDir = cwd();
        const fullCmd = `${currentDir}/packages/backend/src/assets/${this.isolateExecutableName} ${cmd}`;

        logger.info(`sandbox, command: ${fullCmd}`);

        return new Promise((resolve, reject) => {
            exec(fullCmd, (error, stdout: string | PromiseLike<string>, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                if (stderr) {
                    resolve(stderr);
                    return;
                }
                resolve(stdout);
            });
        });
    }

    private isJson(str: string) {
        try {
            JSON.parse(str);
        }
        catch (e) {
            return false;
        }
        return true;
    }

}

export default class SandboxManager {
    private static _instance?: SandboxManager;

    private readonly queue: number[] = [];

    private constructor() {
        if (SandboxManager._instance != null) {
            throw new Error("Use Singleton.instance instead of new.");
        }
        for (let boxId = 0; boxId < 100; ++boxId) {
            this.queue.push(boxId);
        }
        SandboxManager._instance = this;
    }

    obtainSandbox(): Sandbox {
        const sandboxId = this.queue.pop();
        if (sandboxId === undefined) {
            throw new Error("Unexpected error, ran out of sandboxes");
        }
        return new Sandbox(sandboxId);
    }

    returnSandbox(sandboxId: number): void {
        this.queue.push(sandboxId);
    }

    static get instance(): SandboxManager {
        return SandboxManager._instance ?? (SandboxManager._instance = new SandboxManager());
    }
}

export const sandboxManager = SandboxManager.instance;
