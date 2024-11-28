import { spawn } from 'child_process'
import { Server } from 'http'
import { resolve } from 'path'
import { ApLock, AppSystemProp, filePiecesUtils, logger, memoryLock, SharedSystemProp, system } from '@activepieces/server-shared'
import { debounce, isNil, WebsocketClientEvent } from '@activepieces/shared'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { FastifyInstance } from 'fastify'

const packages = system.get(AppSystemProp.DEV_PIECES)?.split(',') || []
const isFilePieces = system.getOrThrow(SharedSystemProp.PIECES_SOURCE) === 'FILE'
export const PIECES_BUILDER_MUTEX_KEY = 'pieces-builder'

async function handleFileChange(piecePackageName: string, io: Server): Promise<void> {
    logger.info(
        chalk.blueBright.bold(
            '👀 Detected changes in pieces. Waiting... 👀 ' + piecePackageName,
        ),
    )
    let lock: ApLock | undefined
    try {
        lock = await memoryLock.acquire(PIECES_BUILDER_MUTEX_KEY)

        logger.info(chalk.blue.bold('🤌 Building pieces... 🤌'))
        if (!/^[A-Za-z0-9-]+$/.test(piecePackageName)) {
            throw new Error(`Piece package name contains invalid character: ${piecePackageName}`)
        }
        const cmd = `npx nx run-many -t build --projects=${piecePackageName}`
        await runCommandWithLiveOutput(cmd)
        await filePiecesUtils.clearPieceCache(piecePackageName)
        io.emit(WebsocketClientEvent.REFRESH_PIECE)
    }
    catch (error) {
        logger.info(error, chalk.red.bold('Failed to run build process...'))
    }
    finally {
        if (lock) {
            await lock.release()
        }
        logger.info(
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

export async function piecesBuilder(app: FastifyInstance, io: Server): Promise<void> {
    // Only run this script if the pieces source is file
    if (!isFilePieces) return

    const watchers: chokidar.FSWatcher[] = []

    for (const packageName of packages) {
        logger.info(chalk.blue(`Starting watch for package: ${packageName}`))

        const pieceDirectory = await filePiecesUtils.findPieceDirectoryByFolderName(packageName)
        if (isNil(pieceDirectory)) {
            logger.info(chalk.yellow(`Piece directory not found for package: ${packageName}`))
            continue
        }
        logger.info(chalk.yellow(`Found piece directory: ${pieceDirectory}`))

        const piecePackageName = `pieces-${packageName}`
        const debouncedHandleFileChange = debounce(() => {
            handleFileChange(piecePackageName, io).catch(logger.error)
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
            if (path.endsWith('.ts')) {
                debouncedHandleFileChange()
            }
        })

        watchers.push(watcher)
    }


    app.addHook('onClose', () => {
        for (const watcher of watchers) {
            watcher.close().catch(logger.error)
        }
    })
}
