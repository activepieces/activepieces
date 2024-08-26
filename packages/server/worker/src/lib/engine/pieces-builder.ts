import { execSync } from 'child_process'
import { Server } from 'http'
import { resolve } from 'path'
import { logger } from '@activepieces/server-shared'
import { assertNotNullOrUndefined, debounce, WebsocketClientEvent } from '@activepieces/shared'
import { Mutex } from 'async-mutex'
import chalk from 'chalk'
import chokidar from 'chokidar'
import { config } from 'dotenv'
import { findPieceDirectoryInSource } from '../utils/pieces-builder-utils'

config({ path: 'packages/server/api/.env' })

const mutex = new Mutex()
const packages = process.env['AP_DEV_PIECES']?.split(',') || []
const processes: Record<string, any> = {}

async function handleFileChange(piecePackageName: string, io: Server): Promise<void> {
    logger.info(
        chalk.yellow.bold(
            '👀 Detected changes in pieces. Waiting... 👀 ' + piecePackageName,
        ),
    )
    try {
        await mutex.acquire()

        const cmd = `nx run-many -t build --projects=${piecePackageName} --skip-nx-cache`
        logger.info(chalk.yellow.bold('🤌 Building pieces... 🤌'))
        logger.info(chalk.yellow('Running Command ' + cmd))

        if (processes[piecePackageName]) {
            processes[piecePackageName].kill('SIGTERM')
            logger.info(chalk.red.bold('Previous build process terminated.'))
        }

        processes[piecePackageName] = execSync(cmd, {
            stdio: 'inherit',
        })
        io.emit(WebsocketClientEvent.REFRESH_PIECE)
    }
    catch (error) {
        logger.info(chalk.red.bold('Failed to run build process...'), error)
    }
    finally {
        mutex.release()
        logger.info(
            chalk.green.bold(
                '✨ Changes are ready! Please refresh the frontend to see the new updates. ✨',
            ),
        )
    }
}

export async function piecesBuilder(io: Server): Promise<void> {
    for (const packageName of packages) {
        logger.info(chalk.blue(`Starting watch for package: ${packageName}`))
        
        const pieceDirectory = await findPieceDirectoryInSource(packageName)
        assertNotNullOrUndefined(pieceDirectory, 'pieceDirectory')
        logger.info(chalk.yellow(`Found piece directory: ${pieceDirectory}`))

        const piecePackageName = `pieces-${packageName}`
        const debouncedHandleFileChange = debounce(() => {
            handleFileChange(piecePackageName, io).catch(logger.error)
        }, 1000)  

        chokidar.watch(resolve(pieceDirectory), { ignored: /^\./, persistent: true }).on('all', (event, path) => {
            if (path.endsWith('.ts')) {
                logger.info(`Event type: ${event}. Changed file: ${path}`)
                debouncedHandleFileChange()
            }
        })
    }
}

process.on('SIGINT', () => {
    logger.info(chalk.red.bold('Process terminated by user.'))
    for (const key in processes) {
        if (processes[key]) {
            processes[key].kill('SIGTERM')
        }
    }
    process.exit()
})