import { arch, cwd } from 'node:process'
import { exec } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { ExecutionMode, system } from '../helper/system/system'
import { SystemProp } from '../helper/system/system-prop'
import { logger } from '../helper/logger'
import { packageManager } from '../helper/package-manager'
import { Mutex } from 'async-mutex'
import { EngineResponse, EngineResponseStatus } from '@activepieces/shared'

const getIsolateExecutableName = () => {
    const defaultName = 'isolate'
    const executableNameMap: Record<string, string> = {
        'arm': 'isolate-arm',
        'arm64': 'isolate-arm',
    }
    return executableNameMap[arch] ?? defaultName
}

const executionMode: ExecutionMode = system.get(SystemProp.EXECUTION_MODE) as ExecutionMode

export type ExecuteIsolateResult = {
    output: unknown
    timeInSeconds: number
    verdict: EngineResponseStatus
    standardOutput: string
    standardError: string
}

export class Sandbox {
    private static readonly isolateExecutableName = getIsolateExecutableName()
    private static readonly sandboxRunTimeSeconds = system.getNumber(SystemProp.SANDBOX_RUN_TIME_SECONDS)!

    public readonly boxId: number
    public used: boolean
    public cached: boolean
    public resourceId: string | null
    public lastUsed: number

    constructor(request: { boxId: number, used: boolean, resourceId: string | null, lastUsed: number, cached: boolean }) {
        this.boxId = request.boxId
        this.used = request.used
        this.cached = request.cached
        this.resourceId = request.resourceId
        this.lastUsed = request.lastUsed
    }


    async recreate(): Promise<void> {
        const sandboxFolderPath = this.getSandboxFolderPath()
        if (executionMode === ExecutionMode.UNSANDBOXED) {
            try {
                await fs.rmdir(sandboxFolderPath, { recursive: true })
            }
            catch (error) {
                // ignored
            }
            await fs.mkdir(sandboxFolderPath, { recursive: true })
        }
        else {
            await Sandbox.runIsolate('--box-id=' + this.boxId + ' --cleanup')
            await Sandbox.runIsolate('--box-id=' + this.boxId + ' --init')
        }
        await packageManager.initProject(this.getSandboxFolderPath())

    }

    async clean(): Promise<void> {
        const filesToDelete = [
            '_standardOutput.txt',
            '_standardError.txt',
            'output.json',
            'meta.txt',
        ]
        const promises = filesToDelete.map((file) => {
            const filePath = path.join(__dirname, this.getSandboxFilePath(file))
            return fs.unlink(filePath).catch((error) => {
                if (error.code !== 'ENOENT') { // Ignore file not found error
                    throw error
                }
            })
        })
        await Promise.all(promises)
    }

    async runCommandLine(commandLine: string): Promise<ExecuteIsolateResult> {
        if (executionMode === ExecutionMode.UNSANDBOXED) {
            const startTime = Date.now()
            const envionment = system.get(SystemProp.ENVIRONMENT)
            const result = await this.runUnsafeCommand(`cd ${this.getSandboxFolderPath()} && env -i AP_ENVIRONMENT=${envionment} NODE_OPTIONS='--enable-source-maps' ${commandLine}`)
            let engineResponse
            if (result.verdict === EngineResponseStatus.OK) {
                engineResponse = await this.parseFunctionOutput()
            }
            return {
                timeInSeconds: (Date.now() - startTime) / 1000,
                verdict: result.verdict,
                output: engineResponse?.response,
                standardOutput: await fs.readFile(this.getSandboxFilePath('_standardOutput.txt'), { encoding: 'utf-8' }),
                standardError: await fs.readFile(this.getSandboxFilePath('_standardError.txt'), { encoding: 'utf-8' }),
            }
        }
        else {
            const metaFile = this.getSandboxFilePath('meta.txt')
            const etcDir = path.resolve('./packages/backend/src/assets/etc/')

            let timeInSeconds
            let output
            let verdict
            try {
                const basePath = path.resolve(__dirname.split('/dist')[0])
                await Sandbox.runIsolate(
                    `--dir=/usr/bin/ --dir=/etc/=${etcDir} --dir=${basePath}=/${basePath}:maybe --share-net --box-id=` +
                    this.boxId +
                    ` --processes --wall-time=${Sandbox.sandboxRunTimeSeconds} --meta=` +
                    metaFile +
                    ' --stdout=_standardOutput.txt' +
                    ' --stderr=_standardError.txt --run ' +
                    ' --env=HOME=/tmp/' +
                    ' --env=NODE_OPTIONS=\'--enable-source-maps\'' +
                    ' --env=AP_ENVIRONMENT ' +
                    commandLine,
                )
                const engineResponse = await this.parseFunctionOutput()
                output = engineResponse.response
                verdict = engineResponse.status
                const metaResult = await this.parseMetaFile()
                timeInSeconds = Number.parseFloat(metaResult.time as string)
            }
            catch (e) {

                const metaResult = await this.parseMetaFile()
                timeInSeconds = Number.parseFloat(metaResult.time as string)
                verdict = metaResult.status == 'TO' ? EngineResponseStatus.TIMEOUT : EngineResponseStatus.ERROR
            }

            const result = {
                timeInSeconds,
                verdict,
                output,
                standardOutput: await fs.readFile(this.getSandboxFilePath('_standardOutput.txt'), { encoding: 'utf-8' }),
                standardError: await fs.readFile(this.getSandboxFilePath('_standardError.txt'), { encoding: 'utf-8' }),
            }

            logger.trace(result, '[Sandbox#runCommandLine] result')

            return result
        }
    }

    async parseMetaFile(): Promise<Record<string, unknown>> {
        const metaFile = this.getSandboxFilePath('meta.txt')
        const lines = (await fs.readFile(metaFile, { encoding: 'utf-8' })).split('\n')
        const result: Record<string, unknown> = {}

        lines.forEach((line: string) => {
            const parts = line.split(':')
            result[parts[0]] = parts[1]
        })
        return result
    }

    getSandboxFolderPath(): string {
        if (executionMode === ExecutionMode.UNSANDBOXED) {
            return path.join(__dirname, '../../sandbox/' + this.boxId)
        }
        return '/var/local/lib/isolate/' + this.boxId + '/box'
    }

    private async parseFunctionOutput(): Promise<EngineResponse<unknown>> {
        const outputFile = this.getSandboxFilePath('output.json')
        if (!(await this.fileExists(outputFile))) {
            throw new Error('Output file not found in ' + outputFile)
        }
        const output = JSON.parse(await fs.readFile(outputFile, { encoding: 'utf-8' }))

        logger.trace(output, '[Sandbox#parseFunctionOutput] output')

        return output
    }

    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath)
            return true
        }
        catch (e) {
            return false
        }
    }


    private getSandboxFilePath(subFile: string) {
        return this.getSandboxFolderPath() + '/' + subFile
    }

    private async runUnsafeCommand(cmd: string): Promise<{
        verdict: EngineResponseStatus
    }> {
        logger.info(`sandbox, command: ${cmd}`)

        const standardOutputPath = this.getSandboxFilePath('_standardOutput.txt')
        const standardErrorPath = this.getSandboxFilePath('_standardError.txt')

        await fs.writeFile(standardOutputPath, '')
        await fs.writeFile(standardErrorPath, '')

        return new Promise((resolve, reject) => {
            const process = exec(cmd, async (error, stdout: string | PromiseLike<string>, stderr) => {
                if (error) {
                    reject(error)
                    return
                }

                if (stdout) {
                    await fs.writeFile(standardOutputPath, await stdout)
                }

                if (stderr) {
                    // Don't return an error, because it's okay for engine to print errors, and they should be caught by the engine
                    await fs.writeFile(standardErrorPath, stderr)
                }

                resolve({ verdict: EngineResponseStatus.OK })
            })

            setTimeout(() => {
                process.kill()
                resolve({ verdict: EngineResponseStatus.TIMEOUT })
            }, Sandbox.sandboxRunTimeSeconds * 1000)
        })
    }

    private static runIsolate(cmd: string): Promise<string> {
        const currentDir = cwd()
        const fullCmd = `${currentDir}/packages/backend/src/assets/${this.isolateExecutableName} ${cmd}`

        logger.info(`sandbox, command: ${fullCmd}`)

        return new Promise((resolve, reject) => {
            exec(fullCmd, (error, stdout: string | PromiseLike<string>, stderr) => {
                if (error) {
                    reject(error)
                    return
                }
                if (stderr) {
                    resolve(stderr)
                    return
                }
                resolve(stdout)
            })
        })
    }

}

export default class SandboxManager {
    private static _instance?: SandboxManager

    private readonly sandboxes = new Map<number, Sandbox>()
    private readonly mutex: Mutex = new Mutex()

    private constructor() {
        if (SandboxManager._instance != null) {
            throw new Error('Use Singleton.instance instead of new.')
        }
        for (let boxId = 0; boxId < 1000; ++boxId) {
            this.sandboxes.set(boxId, new Sandbox({
                boxId,
                cached: false,
                used: false,
                resourceId: null,
                lastUsed: 0,
            }))
        }
        SandboxManager._instance = this
    }

    async obtainSandbox(key: string): Promise<Sandbox> {
        // Acquire the lock
        const release = await this.mutex.acquire()

        // Find sandbox with resourceId equal to key and not used
        const sandbox = Array.from(this.sandboxes.values()).find(s => s.resourceId === key && !s.used)
        if (sandbox) {
            sandbox.used = true
            sandbox.lastUsed = Date.now()
            sandbox.cached = true

            // Release the lock
            release()

            return sandbox
        }

        // Find oldest sandbox not used
        const oldestSandbox = Array.from(this.sandboxes.values()).reduce((oldest, current) => {
            if (current.lastUsed < oldest.lastUsed) {
                return current
            }

            return oldest
        })

        if (oldestSandbox === null) {
            new Error('No sandbox available')
        }
        oldestSandbox.lastUsed = Date.now()
        oldestSandbox.used = true
        oldestSandbox.cached = false
        oldestSandbox.resourceId = key

        // Release the lock
        release()

        return oldestSandbox
    }

    async returnSandbox(sandboxId: number): Promise<void> {
        const release = await this.mutex.acquire()
        const sandbox = this.sandboxes.get(sandboxId)
        if (!sandbox) {
            throw new Error('Sandbox not found')
        }
        sandbox.used = false
        release()
    }

    static get instance(): SandboxManager {
        return SandboxManager._instance ?? (SandboxManager._instance = new SandboxManager())
    }
}

export const sandboxManager = SandboxManager.instance
