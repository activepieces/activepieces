import fs from 'fs/promises'
import fsPath from 'path'
import { isEmpty } from '@activepieces/shared'
import { enrichErrorContext } from './exception-handler'
import { exec } from './exec'
import { logger } from './logger'

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

const runCommand = async (
    path: string,
    command: Command,
    ...args: string[]
): Promise<PackageManagerOutput> => {
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
            '--ignore-scripts',
            '--config.lockfile=false',
            '--config.auto-install-peers=true',
        ]

        const dependencyArgs = dependencies.map((d) => `${d.alias}@${d.spec}`)
        return runCommand(path, 'add', ...dependencyArgs, ...config)
    },

    async init({ path }: InitParams): Promise<PackageManagerOutput> {
        return runCommand(path, 'init')
    },

    async exec({ path, command }: ExecParams): Promise<PackageManagerOutput> {
        return runCommand(path, command)
    },

    async link({
        path,
        linkPath,
        packageName,
    }: LinkParams): Promise<PackageManagerOutput> {
        const config = [
            '--config.lockfile=false',
            '--config.auto-install-peers=true',
        ]

        const result = await runCommand(path, 'link', linkPath, ...config)

        const nodeModules = fsPath.join(path, 'node_modules', packageName)
        await replaceRelativeSystemLinkWithAbsolute(nodeModules)
        return result
    },
}

const replaceRelativeSystemLinkWithAbsolute = async (filePath: string) => {
    try {
    // Inside the isolate sandbox, the relative path is not valid

        const stats = await fs.stat(filePath)

        if (stats.isDirectory()) {
            const realPath = await fs.realpath(filePath)
            logger.info({ realPath, filePath }, '[link]')
            await fs.unlink(filePath)
            await fs.symlink(realPath, filePath, 'dir')
        }
    }
    catch (error) {
        logger.error([error], '[link]')
    }
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
    packageName: string
}
