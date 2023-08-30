import { unlink, readFile, access } from 'node:fs/promises'
import { system } from '../../helper/system/system'
import { SystemProp } from '../../helper/system/system-prop'
import { logger } from '../../helper/logger'
import { packageManager } from '../../helper/package-manager'
import { EngineResponse, EngineResponseStatus } from '@activepieces/shared'

export abstract class AbstractSandbox {
    protected static readonly sandboxRunTimeSeconds = system.getNumber(SystemProp.SANDBOX_RUN_TIME_SECONDS) ?? 600

    public readonly boxId: number
    public used: boolean
    public cached: boolean
    public resourceId: string | null
    public lastUsed: number

    protected constructor(params: SandboxCtorParams) {
        this.boxId = params.boxId
        this.used = params.used
        this.cached = params.cached
        this.resourceId = params.resourceId
        this.lastUsed = params.lastUsed
    }

    protected abstract recreateCleanup(): Promise<void>

    public async recreate(): Promise<void> {
        await this.recreateCleanup()
        const sandboxFolderPath = this.getSandboxFolderPath()
        await packageManager.initProject(sandboxFolderPath)
    }

    public async clean(): Promise<void> {
        const filesToDelete = [
            '_standardOutput.txt',
            '_standardError.txt',
            'output.json',
            'tmp',
            'meta.txt',
        ]

        const promises = filesToDelete.map((file) => {
            const filePath = this.getSandboxFilePath(file)
            return unlink(filePath).catch(
                (e) => logger.debug(e, `[Sandbox#clean] unlink failure filePath=${filePath}`),
            )
        })

        await Promise.all(promises)
    }

    public abstract runCommandLine(commandLine: string): Promise<ExecuteSandboxResult>

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

    public abstract getSandboxFolderPath(): string

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
    used: boolean
    resourceId: string | null
    lastUsed: number
    cached: boolean
}

export type ExecuteSandboxResult = {
    output: unknown
    timeInSeconds: number
    verdict: EngineResponseStatus
    standardOutput: string
    standardError: string
}
