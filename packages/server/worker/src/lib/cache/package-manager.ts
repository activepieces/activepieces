
import {
    CommandOutput,
    execFilePromise,
    fileSystemUtils,
    spawnWithKill,
} from '@activepieces/server-common'
import { tryCatch } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'

export const packageManager = (log: FastifyBaseLogger) => ({
    async validate(): Promise<void> {
        await execPromise('bun --version')
        await execPromise('bun install')
    },
    async install({ path, filtersPath }: InstallParams): Promise<CommandOutput> {
        const installArgs = [
            'install',
            '--ignore-scripts',
        ]
        const filters: string[] = filtersPath
            .map(sanitizeFilterPath)
            .flatMap((p) => ['--filter', `./${p}`])
        await fileSystemUtils.threadSafeMkdir(path)
        const allArgs = [...installArgs, ...filters]
        log.debug({ path, args: allArgs }, '[PackageManager#install]')
        const { error, data } = await tryCatch(async () => spawnWithKill({
            cmd: 'bun',
            args: allArgs,
            options: {
                cwd: path,
            },
            printOutput: false,
            timeoutMs: dayjs.duration(10, 'minutes').asMilliseconds(),
        }))
        if (error) {
            log.error({ error }, '[PackageManager#install] Failed to install dependencies')
            throw error
        }
        return data
    },
    async build({ path, entryFile, outputFile }: BuildParams): Promise<CommandOutput> {
        const buildArgs = [
            'build',
            entryFile,
            '--target', 'node',
            '--production',
            '--format', 'cjs',
            '--outfile', outputFile,
        ]
        log.debug({ path, entryFile, outputFile, args: buildArgs }, '[PackageManager#build]')
        return execFilePromise('bun', buildArgs, { cwd: path })
    },

})

const sanitizeFilterPath = (filterPath: string): string => {
    const allowed = /^(?![.])[a-zA-Z0-9\-_.@/]+$/
    if (!allowed.test(filterPath)) {
        throw new Error(`Invalid filter path ${filterPath}`)
    }
    return filterPath
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
