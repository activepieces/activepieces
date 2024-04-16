import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { EngineResponse, EngineResponseStatus } from '@activepieces/shared'
import { fileExists } from '../../../file-system'
import { logger } from '../../../logger'
import { system } from '../../../system/system'
import { SystemProp } from '../../../system/system-prop'

export abstract class AbstractSandbox {
    protected static readonly sandboxRunTimeSeconds =
        system.getNumber(SystemProp.SANDBOX_RUN_TIME_SECONDS) ?? 600
    protected static readonly nodeExecutablePath = process.execPath

    public readonly boxId: number
    public inUse = false
    protected _cacheKey?: string
    protected _cachePath?: string

    protected constructor(params: SandboxCtorParams) {
        this.boxId = params.boxId
    }

    public get cacheKey(): string | undefined {
        return this._cacheKey
    }

    public abstract recreate(): Promise<void>
    public abstract runOperation(
        operation: string
    ): Promise<ExecuteSandboxResult>
    public abstract getSandboxFolderPath(): string
    protected abstract setupCache(): Promise<void>

    public async assignCache({
        cacheKey,
        cachePath,
    }: AssignCacheParams): Promise<void> {
        logger.debug(
            { boxId: this.boxId, cacheKey, cachePath },
            '[AbstractSandbox#assignCache]',
        )

        this._cacheKey = cacheKey
        this._cachePath = cachePath

        await this.setupCache()
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

    protected getSandboxFilePath(subFile: string): string {
        return `${this.getSandboxFolderPath()}/${subFile}`
    }
}

export type SandboxCtorParams = {
    boxId: number
}

export type ExecuteSandboxResult = {
    output: unknown
    timeInSeconds: number
    verdict: EngineResponseStatus
    standardOutput: string
    standardError: string
}

type AssignCacheParams = {
    cacheKey: string
    cachePath: string
}
