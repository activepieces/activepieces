
import {
    CommandOutput,
    execPromise,
    fileSystemUtils,
    spawnWithKill,
} from '@activepieces/server-shared'
import { tryCatch } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'

export const packageManager = (log: FastifyBaseLogger) => ({
    async validate(): Promise<void> {
        await execPromise('pnpm --version')
        await execPromise('pnpm install')
    },
    async install({ path, filtersPath }: InstallParams): Promise<CommandOutput> {
        const args = [
            '--ignore-scripts',
        ]
        const filters: string[] = filtersPath
            .map(sanitizeFilterPath)
            .map((filterPath) => `--filter ./${filterPath}`)
        await fileSystemUtils.threadSafeMkdir(path)
        log.debug({ path, args, filters }, '[PackageManager#install]')
        const { error, data } = await tryCatch(async () => spawnWithKill({
            cmd: `pnpm install ${args.join(' ')} ${filters.join(' ')}`,
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
        const config = [
            `${entryFile}`,
            '--platform=node',
            '--bundle',
            '--format=cjs',
            `--outfile=${outputFile}`,
        ]
        log.debug({ path, entryFile, outputFile, config }, '[PackageManager#build]')
        return execPromise(`npx esbuild ${config.join(' ')}`, { cwd: path })
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
