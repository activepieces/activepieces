import path from 'node:path'
import { apDayjsDuration, fileSystemUtils } from '@activepieces/server-utils'
import { tryCatch } from '@activepieces/shared'
import { BuildFailure, build as esbuildBuild, Message } from 'esbuild'
import { Logger } from 'pino'
import { CommandOutput, spawnWithKill } from '../../utils/exec'
import { esbuildJail } from './esbuild-jail'

export const bunRunner = (log: Logger) => ({
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
        const { error } = await tryCatch(async () => withTimeout({
            promise: esbuildBuild({
                entryPoints: [entryFile],
                bundle: true,
                platform: 'node',
                format: 'cjs',
                outfile: outputFile,
                absWorkingDir: buildPath,
                tsconfig: path.join(buildPath, 'tsconfig.json'),
                logLevel: 'silent',
                plugins: [esbuildJail(buildPath)],
            }),
            timeoutMs: BUILD_TIMEOUT_MS,
        }))
        if (error) {
            throw new Error(formatBuildError({ error, entryFile, buildPath }))
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

async function withTimeout<T>({ promise, timeoutMs }: { promise: Promise<T>, timeoutMs: number }): Promise<T> {
    let timer: NodeJS.Timeout | undefined
    try {
        return await Promise.race([
            promise,
            new Promise<never>((_resolve, reject) => {
                timer = setTimeout(() => reject(new Error(BUILD_TIMEOUT_MESSAGE)), timeoutMs)
            }),
        ])
    }
    finally {
        if (timer) {
            clearTimeout(timer)
        }
    }
}

function isBuildFailure(error: unknown): error is BuildFailure {
    return error instanceof Error && 'errors' in error && Array.isArray(error.errors)
}

function formatMessageLocation({ message, entryFile, buildPath }: FormatMessageLocationParams): string {
    const location = message.location
    if (location === null || path.resolve(buildPath, location.file) !== path.resolve(entryFile)) {
        return ''
    }
    return ` (${path.basename(entryFile)}:${location.line}:${location.column})`
}

function formatBuildError({ error, entryFile, buildPath }: FormatBuildErrorParams): string {
    if (!isBuildFailure(error)) {
        return error instanceof Error && error.message === BUILD_TIMEOUT_MESSAGE
            ? BUILD_TIMEOUT_MESSAGE
            : 'Failed to compile code step'
    }
    const lines = error.errors.map((message) => `${message.text}${formatMessageLocation({ message, entryFile, buildPath })}`)
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

type FormatMessageLocationParams = {
    message: Message
    entryFile: string
    buildPath: string
}

type FormatBuildErrorParams = {
    error: unknown
    entryFile: string
    buildPath: string
}

const BUILD_TIMEOUT_MS = apDayjsDuration(5, 'minutes').asMilliseconds()

export const BUILD_TIMEOUT_MESSAGE = 'Compiling the code step timed out'
