import { Command } from 'commander'
import chalk from 'chalk'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { ChildProcess, spawn } from 'child_process'
import dotenv from 'dotenv'
import { nanoid } from 'nanoid'
import jwtLibrary from 'jsonwebtoken'

const AP_DIR = path.join(os.homedir(), '.activepieces')
const ENV_FILE = path.join(AP_DIR, '.env')

const KEY_ID = '1'
const ISSUER = 'activepieces'
const ALGORITHM = 'HS256'

function generateWorkerToken(jwtSecret: string): string {
    const payload = {
        id: nanoid(),
        type: 'WORKER',
    }
    const expiresIn = 100 * 365 * 24 * 60 * 60
    return jwtLibrary.sign(payload, jwtSecret, {
        expiresIn,
        keyid: KEY_ID,
        algorithm: ALGORITHM,
        issuer: ISSUER,
    })
}

function loadOrCreateEnv(): Record<string, string> {
    if (!fs.existsSync(AP_DIR)) {
        fs.mkdirSync(AP_DIR, { recursive: true })
    }

    let envVars: Record<string, string> = {}
    if (fs.existsSync(ENV_FILE)) {
        const parsed = dotenv.parse(fs.readFileSync(ENV_FILE, 'utf-8'))
        envVars = { ...parsed }
    }

    const lines: string[] = []

    if (!envVars['AP_JWT_SECRET']) {
        envVars['AP_JWT_SECRET'] = crypto.randomBytes(32).toString('base64')
        lines.push(`AP_JWT_SECRET=${envVars['AP_JWT_SECRET']}`)
    }

    if (!envVars['AP_ENCRYPTION_KEY']) {
        envVars['AP_ENCRYPTION_KEY'] = crypto.randomBytes(16).toString('hex')
        lines.push(`AP_ENCRYPTION_KEY=${envVars['AP_ENCRYPTION_KEY']}`)
    }

    if (!envVars['AP_WORKER_TOKEN']) {
        envVars['AP_WORKER_TOKEN'] = generateWorkerToken(envVars['AP_JWT_SECRET'])
        lines.push(`AP_WORKER_TOKEN=${envVars['AP_WORKER_TOKEN']}`)
    }

    if (lines.length > 0) {
        const existing = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, 'utf-8') : ''
        const separator = existing && !existing.endsWith('\n') ? '\n' : ''
        fs.writeFileSync(ENV_FILE, existing + separator + lines.join('\n') + '\n')
    }

    return envVars
}

function buildEnv(envVars: Record<string, string>, port: number, containerType: string): NodeJS.ProcessEnv {
    const defaults: Record<string, string> = {
        AP_DB_TYPE: 'PGLITE',
        AP_QUEUE_MODE: 'MEMORY',
        AP_ENVIRONMENT: 'prod',
        AP_SERVE_FRONTEND: 'true',
        AP_FRONTEND_URL: `http://localhost:${port}`,
        AP_API_URL: `http://localhost:${port}`,
        AP_WEBHOOK_URL: `http://localhost:${port}`,
        AP_PORT: String(port),
        AP_CONTAINER_TYPE: containerType,
    }

    const merged: Record<string, string> = { ...defaults }

    for (const [key, value] of Object.entries(envVars)) {
        merged[key] = value
    }

    merged['AP_CONTAINER_TYPE'] = containerType
    merged['AP_PORT'] = String(port)

    return { ...process.env, ...merged }
}

// From dist/packages/cli/src/lib/commands/ -> repo root (6 levels up)
function resolveRepoRoot(): string {
    return path.resolve(__dirname, '../../../../../..')
}

function resolveBootstrapPath(name: string): string {
    const repoRoot = resolveRepoRoot()
    return path.join(repoRoot, 'packages', 'server', name, 'dist', 'src', 'bootstrap.js')
}

async function waitForHealth(port: number, timeoutMs: number): Promise<void> {
    const url = `http://localhost:${port}/api/v1/flags`
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
        try {
            const response = await fetch(url, { signal: AbortSignal.timeout(2000) })
            if (response.ok) {
                return
            }
        }
        catch {
            // not ready yet
        }
        await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    throw new Error(`API did not become healthy within ${timeoutMs / 1000}s`)
}

export const startCommand = new Command('start')
    .description('Start Activepieces API and Worker')
    .option('-p, --port <number>', 'Port to run on', '4321')
    .action(async (options: { port: string }) => {
        const port = parseInt(options.port, 10)
        if (isNaN(port)) {
            console.error(chalk.red('Invalid port number'))
            process.exit(1)
        }

        console.log(chalk.blue('Starting Activepieces...'))

        const envVars = loadOrCreateEnv()
        console.log(chalk.gray(`Using config from ${ENV_FILE}`))

        const repoRoot = resolveRepoRoot()
        const apiBootstrap = resolveBootstrapPath('api')
        const workerBootstrap = resolveBootstrapPath('worker')

        if (!fs.existsSync(apiBootstrap)) {
            console.error(chalk.red(`API bootstrap not found at ${apiBootstrap}`))
            console.error(chalk.red('Make sure you have built the project first.'))
            process.exit(1)
        }
        if (!fs.existsSync(workerBootstrap)) {
            console.error(chalk.red(`Worker bootstrap not found at ${workerBootstrap}`))
            console.error(chalk.red('Make sure you have built the project first.'))
            process.exit(1)
        }

        const children: ChildProcess[] = []

        const cleanup = () => {
            for (const child of children) {
                if (!child.killed) {
                    child.kill('SIGTERM')
                }
            }
            process.exit(0)
        }

        process.on('SIGINT', cleanup)
        process.on('SIGTERM', cleanup)

        // Spawn API
        console.log(chalk.gray('Starting API server...'))
        const apiProcess = spawn('node', ['--enable-source-maps', apiBootstrap], {
            env: buildEnv(envVars, port, 'APP'),
            stdio: 'inherit',
            cwd: repoRoot,
        })
        children.push(apiProcess)

        apiProcess.on('exit', (code) => {
            console.error(chalk.red(`API process exited with code ${code}`))
            cleanup()
        })

        // Wait for API to be healthy
        try {
            console.log(chalk.gray('Waiting for API to be ready...'))
            await waitForHealth(port, 60_000)
            console.log(chalk.green('API is ready!'))
        }
        catch (err) {
            console.error(chalk.red((err as Error).message))
            cleanup()
            return
        }

        // Spawn Worker
        console.log(chalk.gray('Starting Worker...'))
        const workerProcess = spawn('node', ['--enable-source-maps', workerBootstrap], {
            env: buildEnv(envVars, port, 'WORKER'),
            stdio: 'inherit',
            cwd: repoRoot,
        })
        children.push(workerProcess)

        workerProcess.on('exit', (code) => {
            console.error(chalk.red(`Worker process exited with code ${code}`))
            cleanup()
        })

        const url = `http://localhost:${port}`
        console.log('')
        console.log(chalk.green.bold('Activepieces is running!'))
        console.log('')
        console.log(`  ${chalk.bold('URL:')}     ${chalk.cyan.underline(url)}`)
        console.log('')
        console.log(chalk.gray('  Press') + chalk.white.bold(' o ') + chalk.gray('to open in browser'))
        console.log(chalk.gray('  Press') + chalk.white.bold(' Ctrl+C ') + chalk.gray('to stop'))
        console.log('')

        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true)
            process.stdin.resume()
            process.stdin.on('data', (key: Buffer) => {
                if (key.toString() === 'o') {
                    const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
                    spawn(openCmd, [url], { stdio: 'ignore', detached: true }).unref()
                }
                // Ctrl+C
                if (key[0] === 3) {
                    cleanup()
                }
            })
        }
    })
