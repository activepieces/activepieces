import { ChildProcess, spawn } from 'node:child_process'
import { access, copyFile, cp } from 'node:fs/promises'
import { join, resolve } from 'path'
import { type ApLock, memoryLock } from '@activepieces/server-utils'
import { isNil, WebsocketClientEvent } from '@activepieces/shared'
import chalk from 'chalk'
import { Server } from 'socket.io'
import { logger } from '../../config/logger'
import { workerSettings } from '../../config/worker-settings'
import { filePiecesUtils } from '../../utils/file-pieces-utils'

const PIECES_BUILDER_MUTEX_KEY = 'pieces-builder'

let pieceGeneration = 0

export const devPiecesState = {
    getGeneration(): number {
        return pieceGeneration
    },
    incrementGeneration(): number {
        return ++pieceGeneration
    },
    isWorkerGenerationStale(workerGeneration: number): boolean {
        const isDev = workerSettings.getSettings().ENVIRONMENT === 'DEVELOPMENT'
        return isDev && workerGeneration !== pieceGeneration
    },
}

async function buildPieces(piecesInfo: PieceInfo[], io: Server): Promise<void> {
    if (piecesInfo.length === 0) return

    for (const piece of piecesInfo) {
        if (!/^[A-Za-z0-9-]+$/.test(piece.pieceName)) {
            throw new Error(`Piece package name contains invalid character: ${piece.pieceName}`)
        }
    }

    const pieceFilters = piecesInfo.map(p => `--filter=@activepieces/piece-${p.pieceName}`).join(' ')
    const sharedFilters = '--filter=@activepieces/pieces-framework --filter=@activepieces/pieces-common --filter=@activepieces/shared'
    const filterArgs = `${sharedFilters} ${pieceFilters} --force`
    logger.info(chalk.blue.bold(`Building ${piecesInfo.length} piece(s): ${piecesInfo.map(p => p.pieceName).join(',')}...`))

    let lock: ApLock | undefined
    try {
        lock = await memoryLock.acquire(PIECES_BUILDER_MUTEX_KEY)

        const startTime = performance.now()
        await spawnAndWait(`npx turbo run build ${filterArgs}`)
        const endTime = performance.now()
        const buildTime = (endTime - startTime) / 1000

        logger.info(chalk.blue.bold(`Build completed in ${buildTime.toFixed(2)} seconds`))

        for (const piece of piecesInfo) {
            await copyPackageJsonToDist(piece.pieceDirectory)
            await copyI18nToDist(piece.pieceDirectory)
            const distPath = await filePiecesUtils(logger).findDistPiecePathByPackageName(piece.packageName)
            if (distPath) {
                filePiecesUtils(logger).clearPieceModuleCache(distPath)
            }
        }

        devPiecesState.incrementGeneration()
        io.emit(WebsocketClientEvent.REFRESH_PIECE)
    }
    catch (error) {
        logger.info({ err: error }, chalk.red.bold('Failed to run build process...'))
    }
    finally {
        if (lock) {
            await lock.release()
        }
        logger.info(
            chalk.green.bold(
                'Changes are ready! Please refresh the frontend to see the new updates.',
            ),
        )
    }
}

export async function devPiecesBuilder(io: Server, piecesNames: string[], onCleanup: (fn: () => Promise<void>) => void): Promise<void> {
    const turboProcesses: ChildProcess[] = []

    const resolvedInfos = await Promise.all(piecesNames.map(async (pieceName) => {
        const pieceDirectory = await filePiecesUtils(logger).findSourcePiecePathByPieceName(pieceName)
        if (isNil(pieceDirectory)) {
            logger.info(chalk.yellow(`Piece directory not found for package: ${pieceName}`))
            return null
        }
        const packageName = await filePiecesUtils(logger).getPackageNameFromFolderPath(pieceDirectory)
        return { pieceName, pieceDirectory, packageName }
    }))
    const pieceInfos: PieceInfo[] = resolvedInfos.filter((info): info is PieceInfo => info !== null)

    // Initial build
    await buildPieces(pieceInfos, io)

    // Start turbo watch for each piece
    for (const pieceInfo of pieceInfos) {
        logger.info(chalk.blue(`Starting turbo watch for package: ${pieceInfo.packageName}`))

        const filterArgs = `--filter=@activepieces/piece-${pieceInfo.pieceName} --filter=@activepieces/pieces-framework --filter=@activepieces/pieces-common --filter=@activepieces/shared`
        const child = spawn('npx', ['turbo', 'watch', 'build', ...filterArgs.split(' ')], {
            cwd: resolve('.'),
            stdio: ['ignore', 'pipe', 'pipe'],
            shell: true,
        })

        child.stdout?.on('data', (data: Buffer) => {
            const output = data.toString()
            if (output.includes('completed successfully') || output.includes('>>> FULL TURBO')) {
                void (async () => {
                    await copyPackageJsonToDist(pieceInfo.pieceDirectory)
                    await copyI18nToDist(pieceInfo.pieceDirectory)
                    const distPath = await filePiecesUtils(logger).findDistPiecePathByPackageName(pieceInfo.packageName)
                    if (distPath) {
                        filePiecesUtils(logger).clearPieceModuleCache(distPath)
                    }
                    devPiecesState.incrementGeneration()
                    io.emit(WebsocketClientEvent.REFRESH_PIECE)
                    logger.info(chalk.green.bold('Changes are ready! Please refresh the frontend.'))
                })()
            }
        })

        child.stderr?.on('data', (data: Buffer) => {
            logger.error(data.toString())
        })

        turboProcesses.push(child)
    }

    onCleanup(async () => {
        for (const child of turboProcesses) {
            child.kill()
        }
    })
}

function spawnAndWait(cmd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, {
            cwd: process.cwd(),
            stdio: 'inherit',
            shell: true,
        })
        child.on('close', (code) => {
            if (code === 0) {
                resolve()
            }
            else {
                reject(new Error(`Command "${cmd}" exited with code ${code}`))
            }
        })
        child.on('error', reject)
    })
}

async function copyPackageJsonToDist(sourceDir: string): Promise<void> {
    const distDir = join(sourceDir, 'dist')
    await copyFile(join(sourceDir, 'package.json'), join(distDir, 'package.json'))
}

async function copyI18nToDist(sourceDir: string): Promise<void> {
    const i18nSrc = join(sourceDir, 'src', 'i18n')
    const exists = await access(i18nSrc).then(() => true).catch(() => false)
    if (!exists) {
        return
    }
    const distDir = join(sourceDir, 'dist')
    const i18nDest = join(distDir, 'src', 'i18n')
    await cp(i18nSrc, i18nDest, { recursive: true })
}

type PieceInfo = {
    packageName: string
    pieceName: string
    pieceDirectory: string
}
