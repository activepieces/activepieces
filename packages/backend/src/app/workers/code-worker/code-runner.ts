import fs from 'node:fs/promises'
import { CodeExecutionResult, CodeRunStatus, apId } from '@activepieces/shared'
import { sandboxManager } from '../sandbox'
import { codeBuilder } from './code-builder'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { logger } from '../../helper/logger'

const nodeExecutablePath = system.getOrThrow(SystemProp.NODE_EXECUTABLE_PATH)

async function run(artifact: Buffer, input: unknown): Promise<CodeExecutionResult> {
    const sandbox = await sandboxManager.obtainSandbox(apId())
    const buildPath = sandbox.getSandboxFolderPath()
    let executionResult: CodeExecutionResult
    try {
        const startTime = Date.now()
        logger.info(`Started Executing Code in sandbox: ${buildPath}`)

        await sandbox.recreate()

        const bundledCode = await codeBuilder.build(artifact)
        const codeExecutor = await fs.readFile('packages/backend/src/assets/code-executor.js')

        await fs.writeFile(`${buildPath}/index.js`, bundledCode)
        await fs.writeFile(`${buildPath}/_input.txt`, JSON.stringify(input))
        await fs.writeFile(`${buildPath}/code-executor.js`, codeExecutor)

        const result = await sandbox.runCommandLine(`${nodeExecutablePath} code-executor.js`)

        executionResult = {
            // TODO FIX
            verdict: CodeRunStatus.OK,
            timeInSeconds: result?.timeInSeconds ?? 0,
            output: result?.output ?? '',
            standardOutput: result?.standardOutput ?? '',
            standardError: result?.standardError ?? '',
        }

        logger.info(`Finished Executing in sandbox: ${buildPath}, duration: ${Date.now() - startTime}ms`)
    }
    finally {
        await sandboxManager.returnSandbox(sandbox.boxId)
    }

    return executionResult
}

export const codeRunner = {
    run,
}
