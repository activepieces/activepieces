import { spawn } from 'child_process'
import fs from 'fs/promises'
import { resolve } from 'path'
import { ApLock, filePiecesUtils, memoryLock, PiecesSource } from '@activepieces/server-shared'
import { debounce, isNil, WebsocketClientEvent } from '@activepieces/shared'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { Server } from 'socket.io'
import { cacheState } from '../../cache/cache-state'
import { CacheState, GLOBAL_CACHE_COMMON_PATH } from '../../cache/worker-cache'

export const PIECES_BUILDER_MUTEX_KEY = 'pieces-builder'

async function checkBuildTarget(nxProjectFilePath: string): Promise<string> {
    try {
        const nxProjectJson = JSON.parse(await fs.readFile(nxProjectFilePath, 'utf-8'))
        if ('targets' in nxProjectJson && nxProjectJson.targets && nxProjectJson.targets['build-with-deps']) {
            return 'build-with-deps'
        }
        return 'build'
    }
    catch (error) {
        return 'build'
    }
}

async function handleFileChange(packages: string[], pieceProjectName: string, piecePackageName: string, nxProjectFilePath: string, io: Server, log: FastifyBaseLogger): Promise<void> {
    log.info(
        chalk.blueBright.bold(
            '👀 Detected changes in pieces. Waiting... 👀 ' + pieceProjectName,
        ),
    )
    let lock: ApLock | undefined
    try {
        lock = await memoryLock.acquire(PIECES_BUILDER_MUTEX_KEY)

        const buildTarget = await checkBuildTarget(nxProjectFilePath)
        log.info(chalk.blue.bold(`🤌 Building pieces with target: ${buildTarget} for ${pieceProjectName}... 🤌`))

        if (!/^[A-Za-z0-9-]+$/.test(pieceProjectName)) {
            throw new Error(`Piece package name contains invalid character: ${pieceProjectName}`)
        }

        const cmd = `npx nx run-many -t ${buildTarget} --projects=${pieceProjectName}`

        const startTime = Date.now()
        await runCommandWithLiveOutput(cmd)
        await filePiecesUtils(packages, log).clearPieceCache(piecePackageName)
        const endTime = Date.now()
        const buildTime = (endTime - startTime) / 1000

        log.info(chalk.blue.bold(`Build completed in ${buildTime.toFixed(2)} seconds`))

        await filePiecesUtils(packages, log).clearPieceCache(piecePackageName)

        const cache = cacheState(GLOBAL_CACHE_COMMON_PATH)
        await cache.setCache('@activepieces/pieces-framework', CacheState.PENDING)
        await cache.setCache('@activepieces/pieces-common', CacheState.PENDING)
        await cache.setCache('@activepieces/shared', CacheState.PENDING)
        await cache.setCache('@activepieces/common-ai', CacheState.PENDING)
        await cache.setCache(piecePackageName, CacheState.PENDING)

        io.emit(WebsocketClientEvent.REFRESH_PIECE)
    }
    catch (error) {
        log.info(error, chalk.red.bold('Failed to run build process...'))
    }
    finally {
        if (lock) {
            await lock.release()
        }
        log.info(
            chalk.green.bold(
                '✨ Changes are ready! Please refresh the frontend to see the new updates. ✨',
            ),
        )
    }
}

async function runCommandWithLiveOutput(cmd: string): Promise<void> {
    const [command, ...args] = cmd.split(' ')

    return new Promise<void>((resolve, reject) => {
        const child = spawn(command, args, { stdio: 'inherit', shell: true })

        child.on('error', reject)
        child.on('close', code => {
            if (code === 0) {
                resolve()
            }
            else {
                reject(new Error(`Process exited with code ${code}`))
            }
        })
    })
}

export async function piecesBuilder(app: FastifyInstance, io: Server, packages: string[], piecesSource: PiecesSource): Promise<void> {

    const isFilePieces = piecesSource === PiecesSource.FILE
    // Only run this script if the pieces source is file
    if (!isFilePieces) return

    const watchers: chokidar.FSWatcher[] = []

    for (const packageName of packages) {
        app.log.info(chalk.blue(`Starting watch for package: ${packageName}`))

        const pieceDirectory = await filePiecesUtils(packages, app.log).findPieceDirectoryByFolderName(packageName)
        if (isNil(pieceDirectory)) {
            app.log.info(chalk.yellow(`Piece directory not found for package: ${packageName}`))
            continue
        }
        app.log.info(chalk.yellow(`Found piece directory: ${pieceDirectory}`))

        const pieceProjectName = `pieces-${packageName}`
        const packageJsonName = await filePiecesUtils(packages, app.log).getPackageNameFromFolderPath(pieceDirectory)
        const nxProjectJson = await filePiecesUtils(packages, app.log).getProjectJsonFromFolderPath(pieceDirectory)
        const debouncedHandleFileChange = debounce(() => {
            handleFileChange(packages, pieceProjectName, packageJsonName, nxProjectJson, io, app.log).catch(app.log.error)
        }, 2000)

        const watcher = chokidar.watch(resolve(pieceDirectory), {
            ignored: [/^\./, /node_modules/, /dist/],
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 200,
            },
        })
        watcher.on('ready', debouncedHandleFileChange)
        watcher.on('all', (event, path) => {
            if (path.endsWith('.ts') || path.endsWith('package.json')) {
                debouncedHandleFileChange()
            }
        })

        watchers.push(watcher)
    }


    app.addHook('onClose', () => {
        for (const watcher of watchers) {
            watcher.close().catch(app.log.error)
        }
    })
}
