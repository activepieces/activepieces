import { apDayjsDuration, fileSystemUtils } from '@activepieces/server-utils'
import { tryCatch } from '@activepieces/shared'
import { Logger } from 'pino'
import { CommandOutput, execPromise, spawnWithKill } from '../../utils/exec'

export const bunRunner = (log: Logger) => ({
    async install({ path, filtersPath }: InstallParams): Promise<CommandOutput> {
        const args = [
            '--ignore-scripts',
        ]
        const filters: string[] = filtersPath
            .map(sanitizeFilterPath)
            .map((path) => `--filter ./${path}`)
        await fileSystemUtils.threadSafeMkdir(path)
        log.debug({ path, args, filters }, '[bunRunner#install]')
        const { error, data } = await tryCatch(async () => spawnWithKill({
            cmd: `bun install ${args.join(' ')} ${filters.join(' ')}`,
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
    async build({ path, entryFile, outputFile }: BuildParams): Promise<CommandOutput> {
        const config = [
            `${entryFile}`,
            '--target node',
            '--production',
            '--format cjs',
            `--outfile ${outputFile}`,
        ]
        log.debug({ path, entryFile, outputFile, config }, '[bunRunner#build]')
        return execPromise(`bun build ${config.join(' ')}`, { cwd: path })
    },
})

function sanitizeFilterPath(filterPath: string): string {
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
