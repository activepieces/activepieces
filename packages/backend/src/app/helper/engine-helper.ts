import { ExecuteFlowOperation, EngineOperationType, CollectionId, PrincipalType, apId, EngineOperation, ExecutionOutput, ExecuteTriggerOperation, TriggerHookType, ProjectId, ExecutePropsOptions } from "@activepieces/shared";
import { Sandbox, sandboxManager } from "../workers/sandbox";
import fs from "node:fs";
import { system } from "./system/system";
import { SystemProp } from "./system/system-prop";
import { tokenUtils } from "../authentication/lib/token-utils";
import { DropdownState, DynamicPropsValue } from "@activepieces/framework";
import { logger } from "../helper/logger";
import chalk from "chalk";

const nodeExecutablePath = system.getOrThrow(SystemProp.NODE_EXECUTABLE_PATH);
const engineExecutablePath = system.getOrThrow(SystemProp.ENGINE_EXECUTABLE_PATH);

export const engineHelper = {
    async executeFlow(sandbox: Sandbox, operation: ExecuteFlowOperation): Promise<ExecutionOutput> {
        return await execute(EngineOperationType.EXECUTE_FLOW, sandbox, {
            ...operation,
            workerToken: await workerToken({ collectionId: operation.collectionId, projectId: operation.projectId })
        }) as ExecutionOutput;
    },
    async executeTrigger(operation: ExecuteTriggerOperation): Promise<void | unknown[]> {
        const sandbox = sandboxManager.obtainSandbox();
        let result;
        try {
            await sandbox.cleanAndInit();
            result = await execute(EngineOperationType.EXECUTE_TRIGGER_HOOK, sandbox, {
                ...operation,
                workerToken: await workerToken({ collectionId: operation.collectionId, projectId: operation.projectId })
            });
        }
        finally {
            sandboxManager.returnSandbox(sandbox.boxId);
        }
        if (operation.hookType === TriggerHookType.RUN) {
            return result as unknown[];
        }
        return result as void;
    },
    async executeProp(operation: ExecutePropsOptions): Promise<DropdownState<any> | Record<string, DynamicPropsValue>> {
        const sandbox = sandboxManager.obtainSandbox();
        let result;
        try {
            await sandbox.cleanAndInit();
            result = await execute(EngineOperationType.EXECUTE_PROPERTY, sandbox, {
                ...operation,
                workerToken: await workerToken({ collectionId: operation.collectionId, projectId: operation.projectId })
            });
        }
        finally {
            sandboxManager.returnSandbox(sandbox.boxId);
        }
        return result;
    }
}

function workerToken(request: { projectId: ProjectId, collectionId: CollectionId }): Promise<string> {
    return tokenUtils.encode({
        type: PrincipalType.WORKER,
        id: apId(),
        projectId: request.projectId,
        collectionId: request.collectionId
    })
}

async function execute(operation: EngineOperationType, sandbox: Sandbox, input: EngineOperation): Promise<unknown> {
    console.log(`Executing ${operation} inside sandbox number ${sandbox.boxId}`)
    const sandboxPath = sandbox.getSandboxFolderPath();
    fs.writeFileSync(sandboxPath + "/activepieces-engine.js", fs.readFileSync(engineExecutablePath));
    fs.writeFileSync(sandboxPath + "/input.json", JSON.stringify({
        ...input,
        apiUrl: "http://127.0.0.1:3000"
    }));
    await sandbox.runCommandLine(`${nodeExecutablePath} activepieces-engine.js ` + operation);
    const standardOutput = await sandbox.parseStandardOutput();
    const standardError = await sandbox.parseStandardError();
    standardOutput.split("\n").forEach(f => {
        if (f.trim().length > 0) logger.info({}, chalk.yellow(f))
    });
    standardError.split("\n").forEach(f => {
        if (f.trim().length > 0) logger.error({}, chalk.red(f))
    });
    return JSON.parse(fs.readFileSync(sandbox.getSandboxFilePath("output.json")).toString());
}
