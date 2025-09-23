import fs from 'fs/promises'
import fsPath from 'path'
import { enrichErrorContext, execPromise, fileSystemUtils } from '@activepieces/server-shared'
import { isEmpty, isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { GLOBAL_CACHE_PATH_LATEST_VERSION } from './worker-cache'

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

    /**
   * if the package is standalone, it means it get installed in it's own folder
   */
    standalone?: boolean
}

const runCommand = async (
    path: string,
    command: Command,
    log: FastifyBaseLogger,
    ...args: string[]
): Promise<PackageManagerOutput> => {
    try {
        log.debug({ path, command, args }, '[PackageManager#execute]')

        await fileSystemUtils.threadSafeMkdir(path)

        const commandLine = `pnpm ${command} ${args.join(' ')}`
        return await execPromise(commandLine, { cwd: path })
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

export const packageManager = (log: FastifyBaseLogger) => ({
    async add({ path, dependencies, installDir }: AddParams): Promise<PackageManagerOutput> {
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
        if (!isNil(installDir)) {
            config.push(`--dir=${installDir}`)
        }

        const dependencyArgs = dependencies.map((d) => `${d.alias}@${d.spec}`)
        return runCommand(path, 'add', log, ...dependencyArgs, ...config)
    },

    async init({ path }: InitParams): Promise<PackageManagerOutput> {
        return fileSystemUtils.runExclusive(GLOBAL_CACHE_PATH_LATEST_VERSION, `pnpm-init-${path}`, async () => {
            const fExists = await fileSystemUtils.fileExists(fsPath.join(path, 'package.json'))
            if (fExists) {
                return {
                    stdout: 'N/A',
                    stderr: 'N/A',
                }
            }
            // It must be awaited so it only releases the lock after the command is done
            const result = await runCommand(path, 'init', log)
            return result
        })
    },

    async exec({ path, command }: ExecParams): Promise<PackageManagerOutput> {
        return runCommand(path, command, log)
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

        const result = await runCommand(path, 'link', log, linkPath, ...config)

        const nodeModules = fsPath.join(path, 'node_modules', packageName)
        await replaceRelativeSystemLinkWithAbsolute(nodeModules, log)
        return result
    },
})

const replaceRelativeSystemLinkWithAbsolute = async (filePath: string, log: FastifyBaseLogger) => {
    try {
        // Inside the isolate sandbox, the relative path is not valid

        const stats = await fs.stat(filePath)

        if (stats.isDirectory()) {
            const realPath = await fs.realpath(filePath)
            log.info({ realPath, filePath }, '[link]')
            await fs.unlink(filePath)
            await fs.symlink(realPath, filePath, 'junction')
        }
    }
    catch (error) {
        log.error([error], '[link]')
    }
}

type AddParams = {
    path: string
    dependencies: PackageInfo[]
    installDir?: string
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
