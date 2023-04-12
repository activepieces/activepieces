import fs from 'node:fs/promises'
import { CodeExecutionResult, CodeRunStatus, apId } from '@activepieces/shared'
import { sandboxManager } from '../sandbox'
import { codeBuilder } from './code-builder'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { logger } from '../../helper/logger'

const nodeExecutablePath = system.getOrThrow(SystemProp.NODE_EXECUTABLE_PATH)

function fromStatus(code: string): CodeRunStatus {
    if (code === undefined) {
        return CodeRunStatus.OK
    }
    switch (code) {
        case 'XX':
            return CodeRunStatus.INTERNAL_ERROR
        case 'TO':
            return CodeRunStatus.TIMEOUT
        case 'RE':
            return CodeRunStatus.RUNTIME_ERROR
        case 'SG':
            return CodeRunStatus.CRASHED
        default:
            return CodeRunStatus.UNKNOWN_ERROR
    }
}

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

        try {
            await sandbox.runCommandLine(`${nodeExecutablePath} code-executor.js`)
        }
        catch (e) {
            // error is ignored as output is read from filesystem
            logger.error(e, 'code runner')
        }

        const metaResult = await sandbox.parseMetaFile()

        executionResult = {
            verdict: fromStatus(metaResult.status as string),
            timeInSeconds: Number.parseFloat(metaResult.time as string),
            output: await sandbox.parseFunctionOutput(),
            standardOutput: await sandbox.parseStandardOutput(),
            standardError: await sandbox.parseStandardError(),
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
