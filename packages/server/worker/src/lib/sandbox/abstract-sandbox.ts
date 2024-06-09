import process from 'node:process'
import { logger, system, SystemProp } from '@activepieces/server-shared'
import { EngineOperation, EngineResponseStatus } from '@activepieces/shared'

export abstract class AbstractSandbox {
    public static readonly sandboxRunTimeSeconds =
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

    public abstract cleanUp(): Promise<void>
    public abstract runOperation(
        operationType: string,
        operation: EngineOperation
    ): Promise<ExecuteSandboxResult>
    public abstract getSandboxFolderPath(): string

    protected getSandboxFilePath(subFile: string): string {
        return `${this.getSandboxFolderPath()}/${subFile}`
    }
    protected abstract setupCache(cachedChanged: boolean): Promise<void>

    public async assignCache({
        cacheKey,
        cachePath,
    }: AssignCacheParams): Promise<void> {
        logger.debug(
            { boxId: this.boxId, cacheKey, cachePath },
            '[AbstractSandbox#assignCache]',
        )
        const cacheChanged = this._cacheKey !== cacheKey
        this._cacheKey = cacheKey
        this._cachePath = cachePath

        await this.setupCache(cacheChanged)
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
