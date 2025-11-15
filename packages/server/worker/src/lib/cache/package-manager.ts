
import {
    execPromise,
    fileSystemUtils,
} from '@activepieces/server-shared'
import { isNil } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'

type PackageManagerOutput = {
    stdout: string
    stderr: string
}

type Command = 'install' | 'build'

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

const piecesConfigs = [
    '--ignore-scripts',
    '--linker isolated',
]
export const packageManager = (log: FastifyBaseLogger) => ({
    async add({
        path,
        dependencies,
        installDir,
    }: AddParams): Promise<PackageManagerOutput> {

        const baseConfig = [...piecesConfigs]
        if (!isNil(installDir)) {
            baseConfig.push(`--dir=${installDir}`)
        }

        const dependenciesArgs = []

        if (!isNil(dependencies)) {
            dependenciesArgs.push(...dependencies.map((dependency) => `${dependency.alias}@${dependency.spec}`))
        }

        return runCommand(path, 'install', log, ...dependenciesArgs, ...baseConfig)
    },

    async installWorkspaces({ path, relativePiecePaths }: InstallWorkspacesParams): Promise<PackageManagerOutput> {
        const args = piecesConfigs
        const filters: string[] = relativePiecePaths.map((path) => `--filter ./${path}`)
        return runCommand(path, 'install', log, ...args, ...filters)
    },
    async build({ path, entryFile, outputFile }: BuildParams): Promise<PackageManagerOutput> {
        const config = [
            `${entryFile}`,
            '--target node',
            '--production',
            '--format cjs',
            `--outfile ${outputFile}`,
        ]
        return runCommand(path, 'build', log, ...config)
    },

})


const runCommand = async (
    path: string,
    command: Command,
    log: FastifyBaseLogger,
    ...args: string[]
): Promise<PackageManagerOutput> => {
    log.debug({ path, command, args }, '[PackageManager#execute]')
    await fileSystemUtils.threadSafeMkdir(path)
    const commandLine = `bun ${command} ${args.join(' ')}`
    return execPromise(commandLine, { cwd: path })
}


type InstallWorkspacesParams = {
    path: string
    relativePiecePaths: string[]
}

type AddParams = {
    path: string
    dependencies?: PackageInfo[]
    installDir?: string
}

type BuildParams = {
    path: string
    entryFile: string
    outputFile: string
}
