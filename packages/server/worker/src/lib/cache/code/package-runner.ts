import { apDayjsDuration, fileSystemUtils } from '@activepieces/server-utils'
import { Logger } from 'pino'
import { CommandOutput, execPromise, spawnWithKill } from '../../utils/exec'

export const packageRunner = (log: Logger) => ({
    async install({ path }: InstallParams): Promise<CommandOutput> {
        await fileSystemUtils.threadSafeMkdir(path)
        log.debug({ path }, '[packageRunner#install]')
        return spawnWithKill({
            cmd: 'pnpm install --prefer-offline --ignore-scripts',
            options: { cwd: path },
            printOutput: false,
            timeoutMs: apDayjsDuration(10, 'minutes').asMilliseconds(),
        })
    },
    async build({ path, entryFile, outputFile }: BuildParams): Promise<CommandOutput> {
        const config = [
            `${entryFile}`,
            '--bundle',
            '--platform=node',
            '--format=cjs',
            `--outfile=${outputFile}`,
        ]
        log.debug({ path, entryFile, outputFile, config }, '[packageRunner#build]')
        return execPromise(`esbuild ${config.join(' ')}`, { cwd: path })
    },
})

type InstallParams = {
    path: string
}

type BuildParams = {
    path: string
    entryFile: string
    outputFile: string
}
