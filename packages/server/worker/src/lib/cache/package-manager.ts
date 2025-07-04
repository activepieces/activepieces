import fs from 'fs/promises'
import fsPath from 'path'
import { enrichErrorContext, execPromise, fileExists, memoryLock } from '@activepieces/server-shared'
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
        
        // Pass environment variables, especially GITHUB_TOKEN for accessing GitHub Package Registry
        const env: NodeJS.ProcessEnv = {
            ...process.env,
            // Ensure npm/pnpm can access GitHub packages if GITHUB_TOKEN is available
            ...(process.env['GITHUB_TOKEN'] && { GITHUB_TOKEN: process.env['GITHUB_TOKEN'] }),
        }
        
        // Check if there's a local .npmrc file and set it via environment variable
        const localNpmrc = fsPath.join(path, '.npmrc')
        const npmrcExists = await fileExists(localNpmrc)
        if (npmrcExists) {
            env['npm_config_userconfig'] = localNpmrc
            log.debug({ npmrcPath: localNpmrc }, '[PackageManager#runCommand] Using local .npmrc')
        }
        
        log.debug({
            hasGithubToken: !!process.env['GITHUB_TOKEN'],
            githubTokenLength: process.env['GITHUB_TOKEN']?.length,
            cwd: path,
            command: commandLine,
            usingLocalNpmrc: !!env['npm_config_userconfig']
        }, '[PackageManager#runCommand] Environment debug info')
        
        return await execPromise(commandLine, { cwd: path, env })
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
            
            // Copy .npmrc file to sandbox if it exists in workspace root
            try {
                const workspaceRoot = process.cwd()
                const sourceNpmrc = fsPath.join(workspaceRoot, '.npmrc')
                const targetNpmrc = fsPath.join(path, '.npmrc')
                
                const npmrcExists = await fileExists(sourceNpmrc)
                if (npmrcExists) {
                    await fs.copyFile(sourceNpmrc, targetNpmrc)
                    log.debug({ sourceNpmrc, targetNpmrc }, 'Copied .npmrc to sandbox')
                }
            }
            catch (error) {
                log.warn({ error }, 'Failed to copy .npmrc to sandbox, continuing without it')
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
        // Ensure .npmrc is available in sandbox before linking
        try {
            const workspaceRoot = process.cwd()
            const sourceNpmrc = fsPath.join(workspaceRoot, '.npmrc')
            const targetNpmrc = fsPath.join(path, '.npmrc')
            
            const npmrcExists = await fileExists(sourceNpmrc)
            const targetNpmrcExists = await fileExists(targetNpmrc)
            
            log.debug({
                workspaceRoot,
                sourceNpmrc,
                targetNpmrc,
                npmrcExists,
                targetNpmrcExists,
            }, '[PackageManager#link] .npmrc debug info')
            
            if (npmrcExists && !targetNpmrcExists) {
                await fs.copyFile(sourceNpmrc, targetNpmrc)
                log.debug('Copied .npmrc to sandbox directory')
                
                // Read and log the contents to verify
                const npmrcContent = await fs.readFile(targetNpmrc, 'utf-8')
                log.debug({
                    npmrcContent: npmrcContent.split('\n').map(line => 
                        line.includes('authToken') ? line.replace(/=.+/, '=[hidden]') : line
                    ).join('\n')
                }, '[PackageManager#link] .npmrc content')
            } else if (targetNpmrcExists) {
                // If it already exists, check its content
                const npmrcContent = await fs.readFile(targetNpmrc, 'utf-8')
                log.debug({
                    npmrcContent: npmrcContent.split('\n').map(line => 
                        line.includes('authToken') ? line.replace(/=.+/, '=[hidden]') : line
                    ).join('\n')
                }, '[PackageManager#link] existing .npmrc content')
            }
        } catch (error) {
            log.error({ error }, 'Failed to copy .npmrc file')
        }

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
