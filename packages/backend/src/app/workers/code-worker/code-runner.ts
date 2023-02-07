import fs from "node:fs";
import { sandboxManager } from "../sandbox";
import { CodeExecutionResult, CodeRunStatus } from "@activepieces/shared";
import { codeBuilder } from "./code-builder";
import { system } from "../../helper/system/system";
import { SystemProp } from "../../helper/system/system-prop";

const fs = require("fs");

const nodeExecutablePath = system.getOrThrow(SystemProp.NODE_EXECUTABLE_PATH);

function fromStatus(code: string): CodeRunStatus {
  if (code === undefined) {
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
  const sandbox = sandboxManager.obtainSandbox();
  const buildPath = sandbox.getSandboxFolderPath();
  let executionResult: CodeExecutionResult;
  try {
    console.log("Started Executing Code in sandbox " + buildPath);
    await sandbox.cleanAndInit();

    const bundledCode = await codeBuilder.build(artifact);
    const codeExecutor = fs.readFileSync("packages/backend/src/assets/code-executor.js");
    fs.writeFileSync(buildPath + "/index.js", bundledCode);
    fs.writeFileSync(buildPath + "/_input.txt", JSON.stringify(input));
    fs.writeFileSync(buildPath + "/code-executor.js", codeExecutor);
    try {
      await sandbox.runCommandLine(`${nodeExecutablePath} code-executor.js`);
    } catch (ignored) {}
    const metaResult = sandbox.parseMetaFile();
    executionResult = {
      verdict: fromStatus(metaResult.status as string),
      timeInSeconds: Number.parseFloat(metaResult.time as string),
      output: sandbox.parseFunctionOutput(),
      standardOutput: sandbox.parseStandardOutput(),
      standardError: sandbox.parseStandardError(),
    };
    console.log("Finished Executing in sandbox " + buildPath);
  } finally {
    sandboxManager.returnSandbox(sandbox.boxId);
  }
  return executionResult;
}

export const codeRunner = {
  run,
};
