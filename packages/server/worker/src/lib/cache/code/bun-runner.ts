import { apDayjsDuration, fileSystemUtils } from '@activepieces/server-utils'
import { tryCatch } from '@activepieces/shared'
import { Logger } from 'pino'
import { CommandOutput, spawnWithKill } from '../../utils/exec'

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
    async build({ path, entryFile, outputFile }: BuildParams): Promise<CommandOutput> {
        const args = [
            entryFile,
            '--bundle',
            '--platform=node',
            '--format=cjs',
            `--outfile=${outputFile}`,
        ]
        log.debug({ path, entryFile, outputFile, args }, '[bunRunner#build]')
        return spawnWithKill({
            cmd: 'esbuild',
            args,
            options: { cwd: path },
            printOutput: false,
            timeoutMs: apDayjsDuration(5, 'minutes').asMilliseconds(),
        })
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
