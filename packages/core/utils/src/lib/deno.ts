import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { sandboxError, SandboxErrorPayload } from './sandbox-error'

export const deno = {
    /**
     * Runs a program body in a one-shot Deno process. The body must assign its
     * output to a `result` variable. Resolves with the result, or rejects with
     * an Error carrying the process stdout/stderr.
     */
    async run({ body, data, permissions, cwd, memoryLimitMb = DEFAULT_MEMORY_LIMIT_MB, allowReadPaths = [], resolveNodeModules = false, env = {}, denoDir, timeoutMs }: DenoProgramParams): Promise<unknown> {
        const keepDenoDir = denoDir !== undefined
        const dataDir = data === undefined ? undefined : await writeDataFile(data)
        const dataFile = dataDir === undefined ? undefined : `${dataDir}/${DATA_FILE_NAME}`
        const { child, denoPath, denoDir: resolvedDenoDir } = await spawnDeno({ entry: '-', dataFile, permissions, cwd, memoryLimitMb, allowReadPaths, resolveNodeModules, env, denoDir })
        child.stdin.end(buildRunProgram({ body }))
        const killTimer = timeoutMs === undefined ? undefined : setTimeout(() => child.kill('SIGKILL'), timeoutMs)
        const cleanup = (): void => {
            if (!keepDenoDir) {
                removeDir(resolvedDenoDir).catch(() => undefined)
            }
            if (dataDir !== undefined) {
                removeDir(dataDir).catch(() => undefined)
            }
        }

        return new Promise((resolve, reject) => {
            let capturedStdout = ''
            let capturedStderr = ''
            let settled = false

            child.stdout.on('data', (data: Buffer) => {
                capturedStdout += data.toString()
            })

            child.stderr.on('data', (data: Buffer) => {
                const text = data.toString()
                capturedStderr += text
                console.error(text.trimEnd())
            })

            child.on('close', (code, signal) => {
                clearTimeout(killTimer)
                cleanup()
                if (settled) {
                    return
                }
                settled = true

                const { userOutput, resultJson } = extractResult(capturedStdout)
                if (userOutput.trim()) {
                    console.log(userOutput.trimEnd())
                }

                if (resultJson === null) {
                    reject(sandboxError.build({ error: `Deno process exited with code ${code} and signal ${signal} without returning a result`, stdout: userOutput, stderr: capturedStderr }))
                    return
                }

                let message: DenoResultMessage
                try {
                    message = JSON.parse(resultJson)
                }
                catch {
                    const processDied = code !== 0 || signal !== null
                    const error = processDied
                        ? `Deno process exited with code ${code} and signal ${signal} while writing its result`
                        : 'Deno process returned a malformed result'
                    reject(sandboxError.build({ error, stdout: userOutput, stderr: capturedStderr }))
                    return
                }

                if (!message.success) {
                    reject(sandboxError.build({ error: message.error, stdout: userOutput, stderr: capturedStderr }))
                }
                else if (code !== 0) {
                    // e.g. an unhandled rejection fired after the result was printed — deno exits
                    // non-zero, so the run must fail even though a success marker exists.
                    reject(sandboxError.build({ error: `Deno process exited with code ${code} and signal ${signal} after producing a result`, stdout: userOutput, stderr: capturedStderr }))
                }
                else {
                    resolve(message.result)
                }
            })

            child.on('error', (error) => {
                clearTimeout(killTimer)
                cleanup()
                if (settled) {
                    return
                }
                settled = true
                reject(sandboxError.build({ error: `Failed to spawn deno (${denoPath}): ${error.message}`, stdout: capturedStdout, stderr: capturedStderr }))
            })
        })
    },

}

// Loaded lazily so this module stays importable from browser bundles — the
// barrel re-exports it into web and piece builds, which must never resolve
// node builtins at load time.
let nodeApisCache: NodeApis | null = null
async function getNodeApis(): Promise<NodeApis> {
    if (nodeApisCache === null) {
        const [childProcess, os, fs] = await Promise.all([
            import('node:child_process'),
            import('node:os'),
            import('node:fs/promises'),
        ])
        nodeApisCache = { childProcess, os, fs }
    }
    return nodeApisCache
}

async function removeDir(dir: string): Promise<void> {
    const { fs } = await getNodeApis()
    await fs.rm(dir, { recursive: true, force: true }).catch(() => undefined)
}

async function writeDataFile(data: unknown): Promise<string> {
    const { os, fs } = await getNodeApis()
    const dataDir = await fs.mkdtemp(`${os.tmpdir()}/ap-deno-data-`)
    await fs.writeFile(`${dataDir}/${DATA_FILE_NAME}`, JSON.stringify(data) ?? 'null', 'utf8')
    return dataDir
}

async function spawnDeno({ entry, dataFile, permissions, cwd, memoryLimitMb, allowReadPaths, resolveNodeModules, env, denoDir }: SpawnDenoParams): Promise<{ child: ChildProcessWithoutNullStreams, denoPath: string, denoDir: string }> {
    const { childProcess, os, fs } = await getNodeApis()
    const denoPath = resolveDenoPath()
    const resolvedDenoDir = denoDir ?? await fs.mkdtemp(`${os.tmpdir()}/ap-deno-`)
    if (denoDir !== undefined) {
        await fs.mkdir(denoDir, { recursive: true })
    }
    const readPaths = dataFile === undefined ? allowReadPaths : [...allowReadPaths, dataFile]
    const child = childProcess.spawn(denoPath, [
        'run',
        '--quiet',
        '--no-prompt',
        '--no-config',
        '--no-lock',
        '--no-remote',
        resolveNodeModules ? '--node-modules-dir=manual' : '--no-npm',
        `--v8-flags=--max-old-space-size=${memoryLimitMb}`,
        ...toPermissionFlags({ permissions, tmpDir: os.tmpdir() }),
        ...permissions.includes(DenoPermission.ALL) ? [] : readPaths.map((path) => `--allow-read=${path}`),
        entry,
        ...dataFile === undefined ? [] : [dataFile],
    ], {
        cwd,
        env: {
            PATH: process.env['PATH'] ?? '',
            ...env,
            DENO_DIR: resolvedDenoDir,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { child, denoPath, denoDir: resolvedDenoDir }
}

function resolveDenoPath(): string {
    if (process.env['AP_DENO_PATH'] === undefined) {
        throw new Error('AP_DENO_PATH is not set: point it at the deno binary to run the code sandbox')
    }
    return process.env['AP_DENO_PATH']
}

function toPermissionFlags({ permissions, tmpDir }: { permissions: DenoPermission[], tmpDir: string }): string[] {
    if (permissions.includes(DenoPermission.ALL)) {
        return ['-A']
    }
    return permissions.flatMap((permission) => {
        switch (permission) {
            case DenoPermission.NET:
                return ['--allow-net']
            case DenoPermission.ENV:
                return ['--allow-env']
            case DenoPermission.RUN:
                return ['--allow-run']
            case DenoPermission.SYS:
                return ['--allow-sys']
            case DenoPermission.WRITE_TMP:
                return [`--allow-write=${tmpDir}`]
            case DenoPermission.READ_TMP:
                return [`--allow-read=${tmpDir}`]
            case DenoPermission.ALL:
            default:
                return []
        }
    })
}

function buildRunProgram({ body }: { body: string }): string {
    return `
${sandboxError.payloadSource}
const log = console.log;
const marker = '__AP_DENO_RESULT_' + crypto.randomUUID() + '__';
log(${JSON.stringify(MARKER_HEADER_PREFIX)} + marker);
let settled = false;
const emit = (payload) => {
    if (settled) return;
    settled = true;
    log(marker + JSON.stringify(payload));
};
globalThis.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    emit({ success: false, error: toErrorPayload(event.reason) });
    Deno.exit(1);
});
try {
    const data = Deno.args.length > 0 ? JSON.parse(await Deno.readTextFile(Deno.args[0])) : undefined;
${body}
    await new Promise((resolve) => setTimeout(resolve, 0));
    emit({ success: true, result: result ?? null });
}
catch (error) {
    emit({ success: false, error: toErrorPayload(error) });
    Deno.exit(1);
}
`
}

function extractResult(stdout: string): { userOutput: string, resultJson: string | null } {
    if (!stdout.startsWith(MARKER_HEADER_PREFIX)) {
        return { userOutput: stdout, resultJson: null }
    }
    const headerEnd = stdout.indexOf('\n')
    if (headerEnd === -1) {
        return { userOutput: '', resultJson: null }
    }
    const marker = stdout.slice(MARKER_HEADER_PREFIX.length, headerEnd)
    const output = stdout.slice(headerEnd + 1)
    const idx = output.lastIndexOf(marker)
    if (idx === -1) {
        return { userOutput: output, resultJson: null }
    }
    const after = output.slice(idx + marker.length)
    const newline = after.indexOf('\n')
    const resultJson = newline === -1 ? after : after.slice(0, newline)
    const trailing = newline === -1 ? '' : after.slice(newline + 1)
    return { userOutput: output.slice(0, idx) + trailing, resultJson }
}

const DEFAULT_MEMORY_LIMIT_MB = 128
const MARKER_HEADER_PREFIX = '__AP_DENO_MARKER__'
const DATA_FILE_NAME = 'data.json'

export enum DenoPermission {
    ALL = 'ALL',
    NET = 'NET',
    ENV = 'ENV',
    RUN = 'RUN',
    SYS = 'SYS',
    WRITE_TMP = 'WRITE_TMP',
    READ_TMP = 'READ_TMP',
}

type DenoProgramParams = {
    body: string
    data?: unknown
    permissions: DenoPermission[]
    cwd?: string
    memoryLimitMb?: number
    allowReadPaths?: string[]
    resolveNodeModules?: boolean
    env?: Record<string, string>
    denoDir?: string
    timeoutMs?: number
}

type SpawnDenoParams = {
    entry: string
    dataFile?: string
    permissions: DenoPermission[]
    cwd?: string
    memoryLimitMb: number
    allowReadPaths: string[]
    resolveNodeModules: boolean
    env: Record<string, string>
    denoDir?: string
}

type NodeApis = {
    childProcess: typeof import('node:child_process')
    os: typeof import('node:os')
    fs: typeof import('node:fs/promises')
}

type DenoResultMessage = {
    success: true
    result: unknown
} | {
    success: false
    error: SandboxErrorPayload
}

