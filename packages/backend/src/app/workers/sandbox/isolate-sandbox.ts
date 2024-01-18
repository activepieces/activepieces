import { readFile } from 'node:fs/promises'
import { arch, cwd } from 'node:process'
import path from 'node:path'
import { exec } from 'node:child_process'
import { ExecuteSandboxResult, AbstractSandbox, SandboxCtorParams } from './abstract-sandbox'
import { EngineResponseStatus } from '@activepieces/shared'
import { logger } from '../../helper/logger'

const getIsolateExecutableName = (): string => {
    const defaultName = 'isolate'

    const executableNameMap: Partial<Record<typeof arch, string>> = {
        'arm': 'isolate-arm',
        'arm64': 'isolate-arm',
    }

    return executableNameMap[arch] ?? defaultName
}

export class IsolateSandbox extends AbstractSandbox {
    private static readonly isolateExecutableName = getIsolateExecutableName()
    private static readonly cacheBindPath = '/root'

    public constructor(params: SandboxCtorParams) {
        super(params)
    }

    public override async recreate(): Promise<void> {
        logger.debug({ boxId: this.boxId }, '[IsolateSandbox#recreate]')

        await IsolateSandbox.runIsolate(`--box-id=${this.boxId} --cleanup`)
        await IsolateSandbox.runIsolate(`--box-id=${this.boxId} --init`)
    }

    public override async runOperation(operation: string): Promise<ExecuteSandboxResult> {
        const metaFile = this.getSandboxFilePath('meta.txt')
        const etcDir = path.resolve('./packages/backend/src/assets/etc/')

        let timeInSeconds
        let output
        let verdict

        try {
            const basePath = path.resolve(__dirname.split('/dist')[0])

            const fullCommand = [
                '--dir=/usr/bin/',
                `--dir=/etc/=${etcDir}`,
                `--dir=${basePath}=/${basePath}:maybe`,
                `--dir=${IsolateSandbox.cacheBindPath}=${this._cachePath}`,
                '--share-net',
                `--box-id=${this.boxId}`,
                '--processes',
                `--wall-time=${AbstractSandbox.sandboxRunTimeSeconds}`,
                `--meta=${metaFile}`,
                '--stdout=_standardOutput.txt',
                '--stderr=_standardError.txt',
                '--run',
                '--env=HOME=/tmp/',
                '--env=NODE_OPTIONS=\'--enable-source-maps\'',
                '--env=AP_PIECES_SOURCE',
                `--env=AP_BASE_CODE_DIRECTORY=${IsolateSandbox.cacheBindPath}/codes`,
                AbstractSandbox.nodeExecutablePath,
                `${IsolateSandbox.cacheBindPath}/main.js`,
                operation,
            ].join(' ')

            await IsolateSandbox.runIsolate(fullCommand)

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
            standardOutput: await readFile(this.getSandboxFilePath('_standardOutput.txt'), { encoding: 'utf-8' }),
            standardError: await readFile(this.getSandboxFilePath('_standardError.txt'), { encoding: 'utf-8' }),
        }

        logger.trace(result, '[IsolateSandbox#runCommandLine] result')

        return result
    }

    public override getSandboxFolderPath(): string {
        return `/var/local/lib/isolate/${this.boxId}/box`
    }

    protected override async setupCache(): Promise<void> {
        logger.debug({ boxId: this.boxId, cacheKey: this._cacheKey, cachePath: this._cachePath }, '[IsolateSandbox#setupCache]')
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
