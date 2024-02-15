import { readFile } from 'node:fs/promises'
import { arch, cwd } from 'node:process'
import path from 'node:path'
import { exec } from 'node:child_process'
import {
    ExecuteSandboxResult,
    AbstractSandbox,
    SandboxCtorParams,
} from './abstract-sandbox'
import {
    EngineResponseStatus,
    assertNotNullOrUndefined,
} from '@activepieces/shared'
import { logger } from 'server-shared'
import { PiecesSource, SystemProp, system } from 'server-shared'

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

    public override async recreate(): Promise<void> {
        logger.debug({ boxId: this.boxId }, '[IsolateSandbox#recreate]')

        await IsolateSandbox.runIsolate(`--box-id=${this.boxId} --cleanup`)
        await IsolateSandbox.runIsolate(`--box-id=${this.boxId} --init`)
    }

    public override async runOperation(
        operation: string,
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
                operation,
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
