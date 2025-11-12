import fs from 'fs/promises'
import fsPath from 'path'
import {
    enrichErrorContext,
    execPromise,
    fileSystemUtils,
} from '@activepieces/server-shared'
import { isEmpty, isNil, PiecePackage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'

type PackageManagerOutput = {
    stdout: string
    stderr: string
}

type CoreCommand = 'install'
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
        const commandLine = `bun ${command} ${args.join(' ')}`
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
    async add({
        path,
        dependencies,
        installDir,
    }: AddParams): Promise<PackageManagerOutput> {

        const config = [
            '--ignore-scripts',
            '--linker isolated'
        ]
        if (!isNil(installDir)) {
            config.push(`--dir=${installDir}`)
        }

        const dependenciesArgs = []

        if (!isNil(dependencies)) {
            dependenciesArgs.push(...dependencies.map((dependency) => `${dependency.alias}@${dependency.spec}`))
        }

        return runCommand(path, 'install', log, ...dependenciesArgs, ...config)
    },

    async createRootPackageJson({ path }: { path: string }): Promise<void> {
        const packageJsonPath = fsPath.join(path, 'package.json')
        const packageJson =  {
            "name": "common",
            "version": "1.0.0",
            "workspaces": [
                "@activepieces/*"
            ],
            "dependencies": {}
        }
        await fileSystemUtils.threadSafeMkdir(fsPath.dirname(packageJsonPath))
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8')
    },

    async createPiecePackageJson({ path, piecePackage }: CreatePiecePackageParams): Promise<void> {
        const packageJsonPath = fsPath.join(path, 'package.json')
            const packageJson = {
                "name": `${piecePackage.pieceName}-${piecePackage.pieceVersion}`,
                "version": `${piecePackage.pieceVersion}`,
                "dependencies": {
                    [piecePackage.pieceName]: piecePackage.pieceVersion
                }
        }
        await fileSystemUtils.threadSafeMkdir(fsPath.dirname(packageJsonPath))
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8')
    },

    async exec({ path, command }: ExecParams): Promise<PackageManagerOutput> {
        return runCommand(path, command, log)
    },

})

type AddParams = {
    path: string
    dependencies?: PackageInfo[]
    installDir?: string
}

type CreatePiecePackageParams = {
    path: string
    piecePackage: PiecePackage
}

type ExecParams = {
    path: string
    command: ExecCommand
}