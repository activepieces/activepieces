import { copyFile } from 'fs/promises'
import { join, resolve } from 'path'
import { ApLock, filePiecesUtils, memoryLock, spawnWithKill } from '@activepieces/server-shared'
import { debounce, isNil, WebsocketClientEvent } from '@activepieces/shared'
import chalk from 'chalk'
import { FSWatcher, watch } from 'chokidar'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { Server } from 'socket.io'
import { devPiecesState } from './dev-pieces-state'

export const PIECES_BUILDER_MUTEX_KEY = 'pieces-builder'

async function buildPieces(pieceNames: string[], sourceDirectories: Map<string, string>, io: Server, log: FastifyBaseLogger): Promise<void> {
    if (pieceNames.length === 0) return

    for (const name of pieceNames) {
        if (!/^[A-Za-z0-9-]+$/.test(name)) {
            throw new Error(`Piece package name contains invalid character: ${name}`)
        }
    }

    const pieceFilters = pieceNames.map(name => `--filter=@activepieces/piece-${name}`).join(' ')
    const sharedFilters = '--filter=@activepieces/pieces-framework --filter=@activepieces/pieces-common --filter=@activepieces/shared'
    const filterArgs = `${sharedFilters} ${pieceFilters} --force`
    log.info(chalk.blue.bold(`🤌 Building ${pieceNames.length} piece(s): ${pieceNames.join(',')}... 🤌`))

    let lock: ApLock | undefined
    try {
        lock = await memoryLock.acquire(PIECES_BUILDER_MUTEX_KEY)

        const startTime = performance.now()
        await spawnWithKill({ cmd: `npx turbo run build ${filterArgs}`, printOutput: true })
        const endTime = performance.now()
        const buildTime = (endTime - startTime) / 1000

        log.info(chalk.blue.bold(`Build completed in ${buildTime.toFixed(2)} seconds`))

        for (const pieceName of pieceNames) {
            const sourceDir = sourceDirectories.get(pieceName)
            if (sourceDir) {
                await copyPackageJsonToDist(sourceDir)
            }
            const distPath = await filePiecesUtils(log).findDistPiecePathByPackageName(`@activepieces/piece-${pieceName}`)
            if (distPath) {
                filePiecesUtils(log).clearPieceModuleCache(distPath)
            }
        }

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
        return { packageName, pieceDirectory }
    }))
    const pieceInfos = resolvedInfos.filter((info) => info !== null)

    const sourceDirectories = new Map(pieceInfos.map(p => [p.packageName, p.pieceDirectory]))

    await buildPieces(pieceInfos.map(p => p.packageName), sourceDirectories, io, app.log)

    for (const { packageName, pieceDirectory } of pieceInfos) {
        app.log.info(chalk.blue(`Starting watch for package: ${packageName}`))
        app.log.info(chalk.yellow(`Found piece directory: ${pieceDirectory}`))

        const debouncedBuild = debounce((): void => {
            void (async (): Promise<void> => {
                try {
                    await buildPieces([packageName], sourceDirectories, io, app.log)
                }
                catch (error) {
                    app.log.error(error)
                }
            })()
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

async function copyPackageJsonToDist(sourceDir: string): Promise<void> {
    const relativePath = sourceDir.split(`${join('packages', 'pieces')}`)[1]
    const distDir = join('dist', 'packages', 'pieces', relativePath)
    await copyFile(join(sourceDir, 'package.json'), join(distDir, 'package.json'))
}
