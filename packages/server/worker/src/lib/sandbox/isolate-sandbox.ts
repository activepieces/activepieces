import { exec } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { arch, cwd } from 'node:process'
import { fileExists, logger, PiecesSource, system, SystemProp } from '@activepieces/server-shared'
import {
    assertNotNullOrUndefined,
    EngineOperation,
    EngineResponse,
    EngineResponseStatus,
} from '@activepieces/shared'
import {
    AbstractSandbox,
    ExecuteSandboxResult,
    SandboxCtorParams,
} from './abstract-sandbox'

const getIsolateExecutableName = (): string => {
    const defaultName = 'isolate'

    const executableNameMap: Partial<Record<typeof arch, string>> = {
        arm: 'isolate-arm',
        arm64: 'isolate-arm',
    }

    return executableNameMap[arch] ?? defaultName
}

export class IsolateSandbox extends AbstractSandbox {
    private static readonly isolateExecutableName = getIsolateExecutableName()
    private static readonly cacheBindPath = '/root'

    public constructor(params: SandboxCtorParams) {
        super(params)
    }

    public override async cleanUp(): Promise<void> {
        logger.debug({ boxId: this.boxId }, '[IsolateSandbox#recreate]')

        await IsolateSandbox.runIsolate(`--box-id=${this.boxId} --cleanup`)
        await IsolateSandbox.runIsolate(`--box-id=${this.boxId} --init`)
    }

    public override async runOperation(
        operationType: string,
        _operation: EngineOperation,
    ): Promise<ExecuteSandboxResult> {
        const metaFile = this.getSandboxFilePath('meta.txt')

        let timeInSeconds
        let output
        let verdict

        try {
            const pieceSource = system.getOrThrow(SystemProp.PIECES_SOURCE)
            const codeSandboxType = system.get(SystemProp.CODE_SANDBOX_TYPE)
            const dirsToBindArgs = this.getDirsToBindArgs()

            const fullCommand = [
                ...dirsToBindArgs,
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
                `--env=AP_PIECES_SOURCE=${pieceSource}`,
                `--env=AP_CODE_SANDBOX_TYPE=${codeSandboxType}`,
                `--env=AP_BASE_CODE_DIRECTORY=${IsolateSandbox.cacheBindPath}/codes`,
                AbstractSandbox.nodeExecutablePath,
                `${IsolateSandbox.cacheBindPath}/main.js`,
                operationType,
            ].join(' ')

            await IsolateSandbox.runIsolate(fullCommand)

            const engineResponse = await this.parseFunctionOutput()
            output = engineResponse.response
            verdict = engineResponse.status
            const metaResult = await this.parseMetaFile()
            timeInSeconds = Number.parseFloat(metaResult['time'] as string)
        }
        catch (e) {
            const metaResult = await this.parseMetaFile()
            timeInSeconds = Number.parseFloat(metaResult['time'] as string)
            verdict =
        metaResult['status'] == 'TO'
            ? EngineResponseStatus.TIMEOUT
            : EngineResponseStatus.ERROR
        }

        const result = {
            timeInSeconds,
            verdict,
            output,
            standardOutput: await readFile(
                this.getSandboxFilePath('_standardOutput.txt'),
                { encoding: 'utf-8' },
            ),
            standardError: await readFile(
                this.getSandboxFilePath('_standardError.txt'),
                { encoding: 'utf-8' },
            ),
        }

        logger.trace(result, '[IsolateSandbox#runCommandLine] result')

        return result
    }

    protected async parseMetaFile(): Promise<Record<string, unknown>> {
        const metaFile = this.getSandboxFilePath('meta.txt')
        const lines = (await readFile(metaFile, { encoding: 'utf-8' })).split('\n')
        const result: Record<string, unknown> = {}

        lines.forEach((line: string) => {
            const parts = line.split(':')
            result[parts[0]] = parts[1]
        })

        return result
    }

    protected async parseFunctionOutput(): Promise<EngineResponse<unknown>> {
        const outputFile = this.getSandboxFilePath('output.json')

        if (!(await fileExists(outputFile))) {
            throw new Error(`Output file not found in ${outputFile}`)
        }

        const output = JSON.parse(
            await readFile(outputFile, { encoding: 'utf-8' }),
        )
        logger.trace(output, '[Sandbox#parseFunctionOutput] output')
        return output
    }

    public override getSandboxFolderPath(): string {
        return `/var/local/lib/isolate/${this.boxId}/box`
    }

    protected override async setupCache(): Promise<void> {
        logger.debug(
            {
                boxId: this.boxId,
                cacheKey: this._cacheKey,
                cachePath: this._cachePath,
            },
            '[IsolateSandbox#setupCache]',
        )
    }

    private static runIsolate(cmd: string): Promise<string> {
        const currentDir = cwd()
        const fullCmd = `${currentDir}/packages/server/api/src/assets/${this.isolateExecutableName} ${cmd}`

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

    /**
   * Creates the arguments for the isolate command to bind the required directories
   */
    private getDirsToBindArgs(): string[] {
        const etcDir = path.resolve('./packages/server/api/src/assets/etc/')
        const cachePath = this._cachePath
        assertNotNullOrUndefined(cachePath, 'cachePath')

        const dirsToBind = [
            '--dir=/usr/bin/',
            `--dir=/etc/=${etcDir}`,
            `--dir=${IsolateSandbox.cacheBindPath}=${path.resolve(cachePath)}`,
        ]

        const piecesSource = system.getOrThrow<PiecesSource>(
            SystemProp.PIECES_SOURCE,
        )

        if (piecesSource === PiecesSource.FILE) {
            const basePath = path.resolve(__dirname.split('/dist')[0])

            dirsToBind.push(
                `--dir=${path.join(basePath, '.pnpm')}=/${path.join(
                    basePath,
                    '.pnpm',
                )}:maybe`,
                `--dir=${path.join(basePath, 'dist')}=/${path.join(
                    basePath,
                    'dist',
                )}:maybe`,
                `--dir=${path.join(basePath, 'node_modules')}=/${path.join(
                    basePath,
                    'node_modules',
                )}:maybe`,
            )
        }

        return dirsToBind
    }
}
