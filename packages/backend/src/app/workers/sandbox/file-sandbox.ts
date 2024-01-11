import { rmdir, mkdir, readFile, writeFile, cp } from 'node:fs/promises'
import fs from 'fs-extra'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { AbstractSandbox, ExecuteSandboxResult, SandboxCtorParams } from './abstract-sandbox'
import { logger } from '../../helper/logger'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { EngineResponseStatus } from '@activepieces/shared'

export class FileSandbox extends AbstractSandbox {
    public constructor(params: SandboxCtorParams) {
        super(params)
    }

    public override async recreate(): Promise<void> {
        logger.debug({ boxId: this.boxId }, '[FileSandbox#recreate]')

        const sandboxFolderPath = this.getSandboxFolderPath()

        try {
            await rmdir(sandboxFolderPath, { recursive: true })
        }
        catch (e) {
            logger.debug(e, `[Sandbox#recreateCleanup] rmdir failure ${sandboxFolderPath}`)
        }

        await mkdir(sandboxFolderPath, { recursive: true })
    }

    public override async runOperation(operation: string): Promise<ExecuteSandboxResult> {
        const startTime = Date.now()
        const pieceSources = system.get(SystemProp.PIECES_SOURCE)

        const command = [
            `cd ${this.getSandboxFolderPath()}`,
            '&&',
            `cross-env AP_PIECES_SOURCE=${pieceSources} NODE_OPTIONS=--enable-source-maps`,
            '&&',
            `"${AbstractSandbox.nodeExecutablePath}"`,
            'main.js',
            operation,
        ].join(' ')

        const result = await this.runUnsafeCommand(command)

        let engineResponse

        if (result.verdict === EngineResponseStatus.OK) {
            engineResponse = await this.parseFunctionOutput()
        }

        return {
            timeInSeconds: (Date.now() - startTime) / 1000,
            verdict: result.verdict,
            output: engineResponse?.response,
            standardOutput: await readFile(this.getSandboxFilePath('_standardOutput.txt'), { encoding: 'utf-8' }),
            standardError: await readFile(this.getSandboxFilePath('_standardError.txt'), { encoding: 'utf-8' }),
        }
    }

    public override getSandboxFolderPath(): string {
        const systemCache = system.get(SystemProp.CACHE_PATH) ?? __dirname
        return path.join(systemCache, 'sandbox', `${this.boxId}`)
    }

    protected override async setupCache(): Promise<void> {
        logger.debug({ boxId: this.boxId, cacheKey: this._cacheKey, cachePath: this._cachePath }, '[FileSandbox#setupCache]')

        if (this._cachePath) {
            if (process.platform === 'win32') {
                await fs.copy(this._cachePath, this.getSandboxFolderPath())
            }
            else {
                await cp(this._cachePath, this.getSandboxFolderPath(), { recursive: true })
            }
        }
    }

    private async runUnsafeCommand(cmd: string): Promise<{ verdict: EngineResponseStatus }> {
        logger.info(`sandbox, command: ${cmd}`)

        const standardOutputPath = this.getSandboxFilePath('_standardOutput.txt')
        const standardErrorPath = this.getSandboxFilePath('_standardError.txt')

        await writeFile(standardOutputPath, '')
        await writeFile(standardErrorPath, '')

        return new Promise((resolve, reject) => {
            const [command, ...args] = cmd.split(' ')
            const process = spawn(command, args, { shell: true })

            let stdout = ''
            let stderr = ''

            process.stdout.on('data', (data: string) => {
                stdout += data
            })

            process.stderr.on('data', (data: string) => {
                stderr += data
            })

            process.on('error', (error: unknown) => {
                reject(error)
            })

            process.on('close', async (code: number) => {
                if (code !== 0) {
                    reject(new Error(`Command failed with code ${code}: ${cmd}`))
                    return
                }

                if (stdout) {
                    await writeFile(standardOutputPath, stdout)
                }

                if (stderr) {
                    // Don't return an error, because it's okay for engine to print errors, and they should be caught by the engine
                    await writeFile(standardErrorPath, stderr)
                }

                resolve({ verdict: EngineResponseStatus.OK })
            })

            setTimeout(() => {
                process.kill()
                resolve({ verdict: EngineResponseStatus.TIMEOUT })
            }, AbstractSandbox.sandboxRunTimeSeconds * 1000)
        })
    }
}
