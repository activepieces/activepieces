import { exec } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process, { arch, cwd } from 'node:process'
import { fileExists, getEngineTimeout, PiecesSource } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, EngineOperation, EngineOperationType, EngineResponse, EngineResponseStatus } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { workerMachine } from '../../../utils/machine'
import { ExecuteSandboxResult } from '../../engine-runner'

type SandboxCtorParams = {
    boxId: number
}


type AssignCacheParams = {
    globalCachePath: string
    globalCodesPath: string
    flowVersionId?: string
    customPiecesPath: string | undefined
    log: FastifyBaseLogger
}

const getIsolateExecutableName = (): string => {
    const defaultName = 'isolate'
    const executableNameMap: Partial<Record<typeof arch, string>> = {
        arm: 'isolate-arm',
        arm64: 'isolate-arm',
    }
    return executableNameMap[arch] ?? defaultName
}

export class IsolateSandbox {

    protected static readonly nodeExecutablePath = process.execPath
    private static readonly isolateExecutableName = getIsolateExecutableName()
    private static readonly sandboxGlobalCachePath = '/root'
    private static readonly sandboxCustomPiecesCachePath = '/node_modules'
    private static readonly sandboxCodesCachePath = '/codes'

    public readonly boxId: number
    public inUse = false
    private _log?: FastifyBaseLogger
    private _globalCachePath?: string
    private _globalCodesPath?: string
    private _flowVersionId?: string
    private _customPiecesPath?: string

    public constructor(params: SandboxCtorParams) {
        this.boxId = params.boxId
    }
    public async cleanUp(): Promise<void> {
        this._log?.debug({ boxId: this.boxId }, '[IsolateSandbox#recreate]')
        await IsolateSandbox.runIsolate(`--box-id=${this.boxId} --cleanup`)
        await IsolateSandbox.runIsolate(`--box-id=${this.boxId} --init`)
    }

    public async runOperation(
        operationType: EngineOperationType,
        _operation: EngineOperation,
    ): Promise<ExecuteSandboxResult> {
        const metaFile = this.getSandboxFilePath('meta.txt')

        let timeInSeconds
        let output
        let verdict

        try {

            const timeout = getEngineTimeout(operationType, workerMachine.getSettings().FLOW_TIMEOUT_SECONDS, workerMachine.getSettings().TRIGGER_TIMEOUT_SECONDS)
            const dirsToBindArgs = this.getDirsToBindArgs()
            const propagatedEnvVars = Object.entries(this.getEnvironmentVariables()).map(([key, value]) => `--env=${key}='${value}'`)
            const fullCommand = [
                ...dirsToBindArgs,
                '--share-net',
                `--box-id=${this.boxId}`,
                '--processes',
                `--wall-time=${timeout}`,
                `--meta=${metaFile}`,
                '--stdout=_standardOutput.txt',
                '--stderr=_standardError.txt',
                '--run',
                ...propagatedEnvVars,
                IsolateSandbox.nodeExecutablePath,
                `${IsolateSandbox.sandboxGlobalCachePath}/main.js`,
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
            verdict = metaResult['status'] == 'TO' ? EngineResponseStatus.TIMEOUT : EngineResponseStatus.ERROR
        }

        const result = {
            timeInSeconds,
            verdict,
            output,
            standardOutput: await readFile(this.getSandboxFilePath('_standardOutput.txt'), { encoding: 'utf-8' }),
            standardError: await readFile(this.getSandboxFilePath('_standardError.txt'), { encoding: 'utf-8' }),
        }

        this._log?.debug(result, '[IsolateSandbox#runCommandLine] result')

        return result
    }

    public getSandboxFolderPath(): string {
        return `/var/local/lib/isolate/${this.boxId}/box`
    }

    protected getSandboxFilePath(subFile: string): string {
        return `${this.getSandboxFolderPath()}/${subFile}`
    }


    public async assignCache({
        globalCachePath,
        log,
        globalCodesPath,
        flowVersionId,
        customPiecesPath,
    }: AssignCacheParams): Promise<void> {
        this._log = log
        this._globalCachePath = globalCachePath
        this._globalCodesPath = globalCodesPath
        this._customPiecesPath = customPiecesPath
        this._flowVersionId = flowVersionId

        log.debug(
            { boxId: this.boxId, globalCachePath, globalCodesPath, flowVersionId },
            '[IsolateSandbox#assignCache]',
        )
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

        const output = JSON.parse(await readFile(outputFile, { encoding: 'utf-8' }))
        this._log?.trace(output, '[Sandbox#parseFunctionOutput] output')
        return output
    }

    private static runIsolate(cmd: string): Promise<string> {
        const currentDir = cwd()
        const fullCmd = `${currentDir}/packages/server/api/src/assets/${this.isolateExecutableName} ${cmd}`
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

    private getEnvironmentVariables(): Record<string, string> {
        const allowedEnvVariables = workerMachine.getSettings().SANDBOX_PROPAGATED_ENV_VARS
        const propagatedEnvVars = Object.fromEntries(allowedEnvVariables.map((envVar) => [envVar, process.env[envVar]]))
        return {
            ...propagatedEnvVars,
            HOME: '/tmp/',
            NODE_OPTIONS: '--enable-source-maps',
            AP_EXECUTION_MODE: workerMachine.getSettings().EXECUTION_MODE,
            AP_PIECES_SOURCE: workerMachine.getSettings().PIECES_SOURCE,
            AP_PAUSED_FLOW_TIMEOUT_DAYS: workerMachine.getSettings().PAUSED_FLOW_TIMEOUT_DAYS.toString(),
            AP_BASE_CODE_DIRECTORY: IsolateSandbox.sandboxCodesCachePath,
            AP_MAX_FILE_SIZE_MB: workerMachine.getSettings().MAX_FILE_SIZE_MB.toString(),
            AP_FILE_STORAGE_LOCATION: workerMachine.getSettings().FILE_STORAGE_LOCATION,
            AP_S3_USE_SIGNED_URLS: workerMachine.getSettings().S3_USE_SIGNED_URLS,
        }
    }

    /**
   * Creates the arguments for the isolate command to bind the required directories
   */
    private getDirsToBindArgs(): string[] {
        const etcDir = path.resolve('./packages/server/api/src/assets/etc/')
        const globalCachePath = this._globalCachePath
        const globalCodesCachePath = this._globalCodesPath
        assertNotNullOrUndefined(globalCodesCachePath, 'globalCodesCachePath')
        assertNotNullOrUndefined(globalCachePath, 'globalCachePath')

        const dirsToBind = [
            '--dir=/usr/bin/',
            `--dir=/etc/=${etcDir}`,
            `--dir=${IsolateSandbox.sandboxGlobalCachePath}=${path.resolve(globalCachePath)}`,
        ]
        if (this._customPiecesPath) {
            dirsToBind.push(`--dir=${IsolateSandbox.sandboxCustomPiecesCachePath}=${path.resolve(this._customPiecesPath, 'node_modules')}`)
        }
        if (this._flowVersionId) {
            dirsToBind.push(`--dir=${path.join(IsolateSandbox.sandboxCodesCachePath, this._flowVersionId)}=${path.resolve(globalCodesCachePath, this._flowVersionId)}`)
        }

        const piecesSource = workerMachine.getSettings().PIECES_SOURCE

        if (piecesSource === PiecesSource.FILE) {
            const basePath = path.resolve(__dirname.split('/dist')[0])

            dirsToBind.push(
                `--dir=${path.join(basePath, '.pnpm')}=/${path.join(basePath, '.pnpm')}:maybe`,
                `--dir=${path.join(basePath, 'dist')}=/${path.join(basePath, 'dist')}:maybe`,
                `--dir=${path.join(basePath, 'node_modules')}=/${path.join(basePath, 'node_modules')}:maybe`,
            )
        }

        return dirsToBind
    }
}
