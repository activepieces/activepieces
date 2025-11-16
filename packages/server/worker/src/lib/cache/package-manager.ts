
import {
    CommandOutput,
    execPromise,
    fileSystemUtils,
} from '@activepieces/server-shared'
import { FastifyBaseLogger } from 'fastify'

export const packageManager = (log: FastifyBaseLogger) => ({
    async install({ path, filtersPath }: InstallParams): Promise<CommandOutput> {
        const args = [
            '--ignore-scripts',
            '--linker isolated',
        ]
        const filters: string[] = filtersPath
            .map(sanitizeFilterPath)
            .map((path) => `--filter ./${path}`)
        await fileSystemUtils.threadSafeMkdir(path)
        log.debug({ path, args, filters }, '[PackageManager#install]')
        return execPromise(`bun install ${args.join(' ')} ${filters.join(' ')}`, { cwd: path })
    },
    async build({ path, entryFile, outputFile }: BuildParams): Promise<CommandOutput> {
        const config = [
            `${entryFile}`,
            '--target node',
            '--production',
            '--format cjs',
            `--outfile ${outputFile}`,
        ]
        log.debug({ path, entryFile, outputFile, config }, '[PackageManager#build]')
        return execPromise(`bun build ${config.join(' ')}`, { cwd: path })
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
