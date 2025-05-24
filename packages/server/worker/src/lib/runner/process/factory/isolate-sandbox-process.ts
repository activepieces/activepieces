import { fork } from "child_process"
import { arch } from "node:process"
import { EngineProcess } from "./engine-factory-types"
import { exec } from "node:child_process"
import path from "node:path"
import { GLOBAL_CACHE_COMMON_PATH, GLOBAL_CACHE_PATH, GLOBAL_CODE_CACHE_PATH } from "../../../cache/execution-files"
import { workerMachine } from "../../../utils/machine"
import { PiecesSource } from "@activepieces/server-shared"
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
        const propagatedEnvVars = Object.entries({
            ...options.env,
            AP_BASE_CODE_DIRECTORY: `/codes`,
            WORKER_ID: workerId,
        }).map(([key, value]) => `--env=${key}='${value}'`)
        await cleanUp(workerIndex.toString(), log)

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
        return exec(fullCommand, options)
    }
})

async function cleanUp(boxId: string, log: FastifyBaseLogger): Promise<void> {
    const cleanupCmd = `--box-id=${boxId} --cleanup`
    const initCmd = `--box-id=${boxId} --init`
    await runIsolateAndStore(cleanupCmd, log)
    await runIsolateAndStore(initCmd, log)
}

function runIsolateAndStore(cmd: string, log: FastifyBaseLogger): Promise<string> {
    return new Promise((resolve, reject) => {
        const fullCmd = `${isolateBinaryPath} ${cmd}`
        log.debug({ command: fullCmd }, '[IsolateSandboxProcess#runIsolateAndStore] Executing command')
        
        exec(fullCmd, (error: Error | null, stdout: string, stderr: string) => {
            if (error) {
                reject(error)
                return
            }
            if (stderr) {
                resolve(stderr)
                return
            }
            resolve(stdout)
        })
    })
}

function getDirsToBindArgs(flowVersionId: string | undefined, customPiecesPath: string): string[] {
    const etcDir = path.resolve('./packages/server/api/src/assets/etc/')

    const dirsToBind = [
        '--dir=/usr/bin/',
        `--dir=/etc/=${etcDir}`,
        `--dir=/root=${path.resolve(GLOBAL_CACHE_COMMON_PATH)}`,
    ]
    if (flowVersionId) {
        dirsToBind.push(`--dir=${path.join('/codes', flowVersionId)}=${path.resolve(GLOBAL_CODE_CACHE_PATH, flowVersionId)}`)
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