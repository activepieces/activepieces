import { resolve } from 'path'
import { ApLock, filePiecesUtils, memoryLock, spawnWithKill } from '@activepieces/server-shared'
import { debounce, isNil, WebsocketClientEvent } from '@activepieces/shared'
import chalk from 'chalk'
import { FSWatcher, watch } from 'chokidar'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { Server } from 'socket.io'
import { devPiecesInstaller } from './dev-pieces-installer'
import { devPiecesState } from './dev-pieces-state'

export const PIECES_BUILDER_MUTEX_KEY = 'pieces-builder'

async function buildPieces(pieceNames: string[], io: Server, log: FastifyBaseLogger): Promise<void> {
    if (pieceNames.length === 0) return

    const projectNames = pieceNames.map(name => `pieces-${name}`)

    for (const projectName of projectNames) {
        if (!/^[A-Za-z0-9-]+$/.test(projectName)) {
            throw new Error(`Piece package name contains invalid character: ${projectName}`)
        }
    }

    const projectList = projectNames.join(',')
    log.info(chalk.blue.bold(`🤌 Building ${projectNames.length} piece(s): ${projectList}... 🤌`))

    let lock: ApLock | undefined
    try {
        lock = await memoryLock.acquire(PIECES_BUILDER_MUTEX_KEY)

        const startTime = performance.now()
        await spawnWithKill({ cmd: `npx nx run-many --batch -t build --projects=${projectList}`, printOutput: true })
        const endTime = performance.now()
        const buildTime = (endTime - startTime) / 1000

        log.info(chalk.blue.bold(`Build completed in ${buildTime.toFixed(2)} seconds`))

        devPiecesState.incrementGeneration()
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

export async function devPiecesBuilder(app: FastifyInstance, io: Server, packages: string[]): Promise<void> {
    const watchers: FSWatcher[] = []

    const resolvedInfos = await Promise.all(packages.map(async (packageName) => {
        const pieceDirectory = await filePiecesUtils(app.log).findSourcePiecePathByPieceName(packageName)
        if (isNil(pieceDirectory)) {
            app.log.info(chalk.yellow(`Piece directory not found for package: ${packageName}`))
            return null
        }
        const packageJsonName = await filePiecesUtils(app.log).getPackageNameFromFolderPath(pieceDirectory)
        return { packageName, pieceDirectory, packageJsonName }
    }))
    const pieceInfos = resolvedInfos.filter((info) => info !== null)

    await buildPieces(pieceInfos.map(p => p.packageName), io, app.log)

    await devPiecesInstaller(app.log).linkSharedActivepiecesPackagesToEachOther()
    for (const { packageJsonName } of pieceInfos) {
        await devPiecesInstaller(app.log).linkSharedActivepiecesPackagesToPiece(packageJsonName)
    }

    for (const { packageName, pieceDirectory } of pieceInfos) {
        app.log.info(chalk.blue(`Starting watch for package: ${packageName}`))
        app.log.info(chalk.yellow(`Found piece directory: ${pieceDirectory}`))

        const debouncedBuild = debounce(() => {
            buildPieces([packageName], io, app.log).catch(app.log.error)
        }, 2000)

        const watcher = watch(resolve(pieceDirectory), {
            ignored: [/^\./, /node_modules/, /dist/],
            persistent: true,
            ignoreInitial: true,
            awaitWriteFinish: {
                stabilityThreshold: 2000,
                pollInterval: 200,
            },
        })
        watcher.on('all', (_event, path) => {
            if (path.endsWith('.ts') || path.endsWith('package.json')) {
                debouncedBuild()
            }
        })

        watchers.push(watcher)
    }

    app.addHook('onClose', async () => {
        await Promise.all(watchers.map(watcher => watcher.close().catch(app.log.error)))
    })
}
