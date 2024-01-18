import { enrichErrorContext } from './error-handler'
import { exec } from './exec'
import { logger } from './logger'
import { isEmpty } from '@activepieces/shared'

type PackageManagerOutput = {
    stdout: string
    stderr: string
}

type CoreCommand = 'add' | 'init' | 'link'
type ExecCommand = 'tsc'
type Command = CoreCommand | ExecCommand

export type PackageInfo = {
    /**
     * name or alias
     */
    alias: string

    /**
     * where to get the package from, could be an npm tag, a local path, or a tarball.
     */
    spec: string
}

const runCommand = async (path: string, command: Command, ...args: string[]): Promise<PackageManagerOutput> => {
    try {
        logger.debug({ path, command, args }, '[PackageManager#execute]')

        const commandLine = `pnpm ${command} ${args.join(' ')}`
        return await exec(commandLine, { cwd: path })
    }
    catch (error) {
        const contextKey = '[PackageManager#runCommand]'
        const contextValue = { path, command, args }

        const enrichedError = enrichErrorContext({
            error,
            key: contextKey,
            value: contextValue,
        })

        throw enrichedError
    }
}

export const packageManager = {
    async add({ path, dependencies }: AddParams): Promise<PackageManagerOutput> {
        if (isEmpty(dependencies)) {
            return {
                stdout: '',
                stderr: '',
            }
        }

        const config = [
            '--prefer-offline',
            '--config.lockfile=false',
            '--config.auto-install-peers=true',
        ]

        const dependencyArgs = dependencies.map(d => `${d.alias}@${d.spec}`)
        return runCommand(path, 'add', ...dependencyArgs, ...config)
    },

    async init({ path }: InitParams): Promise<PackageManagerOutput> {
        return runCommand(path, 'init')
    },

    async exec({ path, command }: ExecParams): Promise<PackageManagerOutput> {
        return runCommand(path, command)
    },

    async link({ path, linkPath }: LinkParams): Promise<PackageManagerOutput> {
        const config = [
            '--config.lockfile=false',
            '--config.auto-install-peers=true',
        ]

        return runCommand(path, 'link', linkPath, ...config)
    },
}

type AddParams = {
    path: string
    dependencies: PackageInfo[]
}

type InitParams = {
    path: string
}

type ExecParams = {
    path: string
    command: ExecCommand
}

type LinkParams = {
    path: string
    linkPath: string
}
