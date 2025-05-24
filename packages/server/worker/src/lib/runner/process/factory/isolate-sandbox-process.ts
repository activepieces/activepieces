import { arch } from "node:process"
import { EngineProcess } from "./engine-factory-types"
import { spawn } from "node:child_process"
import path from "node:path"
import { GLOBAL_CACHE_COMMON_PATH, GLOBAL_CODE_CACHE_PATH } from "../../../cache/execution-files"
import { workerMachine } from "../../../utils/machine"
import { exec, PiecesSource } from "@activepieces/server-shared"
import { FastifyBaseLogger } from "fastify"

const getIsolateExecutableName = (): string => {
    const defaultName = 'isolate'
    const executableNameMap: Partial<Record<typeof arch, string>> = {
        arm: 'isolate-arm',
        arm64: 'isolate-arm',
    }

    return executableNameMap[arch] ?? defaultName
}

const currentDir = process.cwd()
const nodeExecutablePath = process.execPath
const isolateBinaryPath = path.resolve(currentDir, 'packages/server/api/src/assets', getIsolateExecutableName())

export const isolateSandboxProcess = (log: FastifyBaseLogger): EngineProcess => ({
    create: async (params) => {
        const { workerId, workerIndex, options } = params

        const { stdout: cleanupOutput, stderr: cleanupError } = await exec(`${isolateBinaryPath} --box-id=${workerIndex} --cleanup`)
        const { stdout: initOutput, stderr: initError } = await exec(`${isolateBinaryPath} --box-id=${workerIndex} --init`)
        log.debug({ cleanupOutput, cleanupError, initOutput, initError }, '[IsolateSandboxProcess#create] Isolate cleanup and init output')

        const propagatedEnvVars = getEnvironmentVariables(options.env, workerId)
        const dirsToBindArgs: string[] = getDirsToBindArgs(params.flowVersionId, params.customPiecesPath)
        const fullCommand = [
            isolateBinaryPath,
            ...dirsToBindArgs,
            '--share-net',
            `--box-id=${workerIndex}`,
            '--processes',
            '--run',
            ...propagatedEnvVars,
            nodeExecutablePath,
            `/root/main.js`
        ].join(' ')

        log.debug({ command: fullCommand }, '[IsolateSandboxProcess#create] Executing command')
        const isolateProcess = spawn(fullCommand, { shell: true, ...options })
        isolateProcess.stdout?.pipe(process.stdout)
        isolateProcess.stderr?.pipe(process.stderr)
        return isolateProcess
    }
})


function getEnvironmentVariables(env: Record<string, string | undefined>, workerId: string): string[] {
    return Object.entries({
        ...env,
        AP_BASE_CODE_DIRECTORY: `/codes`,
        WORKER_ID: workerId,
    }).map(([key, value]) => `--env=${key}='${value}'`)
}

function getDirsToBindArgs(flowVersionId: string | undefined, customPiecesPath: string): string[] {
    const etcDir = path.resolve('./packages/server/api/src/assets/etc/')

    const dirsToBind = [
        '--dir=/usr/bin/',
        `--dir=/etc/=${etcDir}`,
        `--dir=/root=${path.resolve(GLOBAL_CACHE_COMMON_PATH)}`,
    ]
    if (flowVersionId) {
        dirsToBind.push(`--dir=${path.join('/codes', flowVersionId)}=${path.resolve(GLOBAL_CODE_CACHE_PATH, flowVersionId)}:maybe`)
    }
    if (customPiecesPath) {
        dirsToBind.push(`--dir=/node_modules=${path.resolve(customPiecesPath, 'node_modules')}:maybe`)
    }

    const piecesSource = workerMachine.getSettings().PIECES_SOURCE

    if (piecesSource === PiecesSource.FILE) {
        const basePath = path.resolve(__dirname.split('/dist')[0])

        dirsToBind.push(
            `--dir=${path.join(basePath, '.pnpm')}=/${path.join(basePath, '.pnpm')}:maybe`,
            `--dir=${path.join(basePath, 'dist')}=/${path.join(basePath, 'dist')}:maybe`,
            `--dir=${path.join(basePath, 'node_modules')}=/${path.join(basePath, 'node_modules')}:maybe`,
        )
    }

    return dirsToBind
}