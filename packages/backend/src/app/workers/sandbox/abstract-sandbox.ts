import { readFile, access } from 'node:fs/promises'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { logger } from '../../helper/logger'
import { packageManager } from '../../helper/package-manager'
import { EngineResponse, EngineResponseStatus } from '@activepieces/shared'

export abstract class AbstractSandbox {
    protected static readonly sandboxRunTimeSeconds = system.getNumber(SystemProp.SANDBOX_RUN_TIME_SECONDS) ?? 600

    public readonly boxId: number
    public inUse = false

    protected constructor(params: SandboxCtorParams) {
        this.boxId = params.boxId
    }

    protected abstract recreateCleanup(): Promise<void>
    public abstract runCommandLine(commandLine: string): Promise<ExecuteSandboxResult>
    public abstract getSandboxFolderPath(): string
    public abstract useCache(cachePath: string): Promise<void>

    public async recreate(): Promise<void> {
        await this.recreateCleanup()
        const sandboxFolderPath = this.getSandboxFolderPath()
        await packageManager.initProject(sandboxFolderPath)
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

        if (!(await this.fileExists(outputFile))) {
            throw new Error(`Output file not found in ${outputFile}`)
        }

        const output = JSON.parse(await readFile(outputFile, { encoding: 'utf-8' }))
        logger.trace(output, '[Sandbox#parseFunctionOutput] output')
        return output
    }

    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await access(filePath)
            return true
        }
        catch (e) {
            return false
        }
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
