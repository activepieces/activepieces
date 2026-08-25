import path from 'node:path'
import { tryCatch } from '@activepieces/core-utils'
import { apDayjsDuration, fileSystemUtils } from '@activepieces/server-utils'
import { type ApLogger } from '@activepieces/server-utils'
import { type BuildFailure, build as esbuildBuild, type Message } from 'esbuild'
import { stepFolderResolvePlugin } from './esbuild-build-options'
import { CommandOutput, spawnWithKill } from './exec'

export const bunRunner = (log: ApLogger) => ({
    async install({ path, filtersPath }: InstallParams): Promise<CommandOutput> {
        const filterArgs: string[] = filtersPath
            .map(sanitizeFilterPath)
            .flatMap((p) => ['--filter', `./${p}`])
        const args = [
            'install',
            '--ignore-scripts',
            ...filterArgs,
        ]
        await fileSystemUtils.threadSafeMkdir(path)
        log.debug({ path, args }, '[bunRunner#install]')
        const { error, data } = await tryCatch(async () => spawnWithKill({
            cmd: 'bun',
            args,
            options: {
                cwd: path,
            },
            printOutput: false,
            timeoutMs: apDayjsDuration(10, 'minutes').asMilliseconds(),
        }))
        if (error) {
            log.error({ error }, '[bunRunner#install] Failed to install dependencies')
            throw error
        }
        return data
    },
    async build({ path: buildPath, entryFile, outputFile }: BuildParams): Promise<CommandOutput> {
        log.debug({ path: buildPath, entryFile, outputFile }, '[bunRunner#build]')
        const { error } = await tryCatch(async () => esbuildBuild({
            entryPoints: [entryFile],
            bundle: true,
            platform: 'node',
            format: 'cjs',
            outfile: outputFile,
            absWorkingDir: buildPath,
            tsconfig: path.join(buildPath, 'tsconfig.json'),
            logLevel: 'silent',
            plugins: [stepFolderResolvePlugin(buildPath)],
        }))
        if (error) {
            throw new Error(formatBuildError({ error, entryFile }))
        }
        return { stdout: '', stderr: '' }
    },
})

function sanitizeFilterPath(filterPath: string): string {
    const allowed = /^(?![.])[a-zA-Z0-9\-_.@/]+$/
    if (!allowed.test(filterPath)) {
        throw new Error(`Invalid filter path ${filterPath}`)
    }
    return filterPath
}

function isBuildFailure(error: unknown): error is BuildFailure {
    return error instanceof Error && Array.isArray((error as Partial<BuildFailure>).errors)
}

function formatMessageLocation(message: Message, entryFile: string): string {
    const location = message.location
    if (location === null || path.basename(location.file) !== path.basename(entryFile)) {
        return ''
    }
    return ` (index.ts:${location.line}:${location.column})`
}

function formatBuildError({ error, entryFile }: FormatBuildErrorParams): string {
    if (!isBuildFailure(error)) {
        return 'Failed to compile code step'
    }
    const lines = error.errors.map((message) => `${message.text}${formatMessageLocation(message, entryFile)}`)
    return lines.length > 0 ? lines.join('\n') : 'Failed to compile code step'
}

type InstallParams = {
    path: string
    filtersPath: string[]
}

type BuildParams = {
    path: string
    entryFile: string
    outputFile: string
}

type FormatBuildErrorParams = {
    error: unknown
    entryFile: string
}
