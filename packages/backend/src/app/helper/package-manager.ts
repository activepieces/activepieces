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

const enrichErrorContext = (error: unknown, key: string, value: unknown): unknown => {
    if (error instanceof Error) {
        if ('context' in error && error.context instanceof Object) {
            const enrichedError = Object.assign(error, {
                ...error.context,
                [key]: value,
            })

            return enrichedError
        }
        else {
            const enrichedError = Object.assign(error, {
                context: {
                    [key]: value,
                },
            })

            return enrichedError
        }
    }

    return error
}

const runCommand = async (path: string, command: Command, ...args: string[]): Promise<PackageManagerOutput> => {
    try {
        logger.debug({ path, command, args }, '[PackageManager#execute]')

        const commandLine = `pnpm ${command} ${args.join(' ')}`
        return await exec(commandLine, { cwd: path })
    }
    catch(e) {
        const error = e as Record<string, object>

        error.context = {
            ...error.context,
            ['PackageManager#execute']: {
                path,
                command,
                args,
            },
        }

        throw error as Error
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
        return await runCommand(path, 'add', ...dependencyArgs, ...config)
    },

    async init({ path }: InitParams): Promise<PackageManagerOutput> {
        return await runCommand(path, 'init')
    },

    async exec({ path, command }: ExecParams): Promise<PackageManagerOutput> {
        return await runCommand(path, command)
    },

    async link({ path, linkPath }: LinkParams): Promise<PackageManagerOutput> {
        const config = [
            '--config.lockfile=false',
            '--config.auto-install-peers=true',
        ]

        return await runCommand(path, 'link', linkPath, ...config)
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
