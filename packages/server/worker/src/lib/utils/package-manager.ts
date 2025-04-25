import fs from 'fs/promises'
import fsPath from 'path'
import { enrichErrorContext, exec, fileExists, memoryLock } from '@activepieces/server-shared'
import { isEmpty } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'

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
    log: FastifyBaseLogger,
    ...args: string[]
): Promise<PackageManagerOutput> => {
    try {
        log.debug({ path, command, args }, '[PackageManager#execute]')

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

export const packageManager = (log: FastifyBaseLogger) => ({
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
        return runCommand(path, 'add', log, ...dependencyArgs, ...config)
    },

    async init({ path }: InitParams): Promise<PackageManagerOutput> {
        const lock = await memoryLock.acquire(`pnpm-init-${path}`)
        try {
            const fExists = await fileExists(fsPath.join(path, 'package.json'))
            if (fExists) {
                return {
                    stdout: 'N/A',
                    stderr: 'N/A',
                }
            }
            // It must be awaited so it only releases the lock after the command is done
            const result = await runCommand(path, 'init', log)
            return result
        }
        finally {
            await lock.release()
        }
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
