import {sandboxManager} from "../sandbox";
import {CodeExecutionResult, CodeRunStatus} from "shared";
import {codeBuilder} from "./code-builder";

const fs = require("fs");

function fromStatus(code: string): CodeRunStatus {
    if(code === undefined){
        return CodeRunStatus.OK;
    }
    switch (code) {
        case "XX":
            return CodeRunStatus.INTERNAL_ERROR;
        case "TO":
            return CodeRunStatus.TIMEOUT;
        case "RE":
            return CodeRunStatus.RUNTIME_ERROR;
        case "SG":
            return CodeRunStatus.CRASHED;
        default:
            return CodeRunStatus.UNKNOWN_ERROR;
    }
}

async function run(artifact: Buffer, input: unknown): Promise<CodeExecutionResult> {
    let sandbox = sandboxManager.obtainSandbox();
    let buildPath = sandbox.getSandboxFolderPath();
    let executionResult: CodeExecutionResult;
    try {
        console.log("Started Executing Code in sandbox " + buildPath);
        sandbox.cleanAndInit();

        let bundledCode = await codeBuilder.build(artifact);
        let codeExecutor = fs.readFileSync("resources/code-executor.js");
        fs.writeFileSync(buildPath + "/index.js", bundledCode);
        fs.writeFileSync(buildPath + "/_input.txt", JSON.stringify(input));
        fs.writeFileSync(buildPath + "/code-executor.js", codeExecutor);
        try {
            sandbox.runCommandLine("/usr/bin/node code-executor.js");
        }catch (ignored){}
        let metaResult = sandbox.parseMetaFile();
        executionResult = {
            verdict: fromStatus(metaResult['status'] as string),
            timeInSeconds: Number.parseFloat(metaResult['time'] as string),
            output: sandbox.parseFunctionOutput(),
            standardOutput: sandbox.parseStandardOutput(),
            standardError: sandbox.parseStandardError()
        }
        console.log("Finished Executing in sandbox " + buildPath);
    } finally {
        sandboxManager.returnSandbox(sandbox.boxId);
    }
    return executionResult;
}

export const codeRunner = {
    run: run
}