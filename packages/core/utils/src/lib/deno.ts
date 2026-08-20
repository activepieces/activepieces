import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { nanoid } from 'nanoid'

export const deno = {
    /**
     * Runs a program body in a one-shot Deno process. The body must assign its
     * output to a `result` variable. Resolves with the result, or rejects with
     * an Error carrying the process stdout/stderr.
     */
    async run({ body, permissions, cwd, memoryLimitMb = DEFAULT_MEMORY_LIMIT_MB }: DenoProgramParams): Promise<unknown> {
        const marker = newResultMarker()
        const { child, denoPath } = await spawnDeno({ entry: '-', permissions, cwd, memoryLimitMb })
        child.stdin.end(buildRunProgram({ body, marker }))

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
                if (settled) {
                    return
                }
                settled = true

                const { userOutput, resultJson } = extractResult(capturedStdout, marker)
                if (userOutput.trim()) {
                    console.log(userOutput.trimEnd())
                }

                if (resultJson === null) {
                    reject(buildError({ message: `Deno process exited with code ${code} and signal ${signal} without returning a result`, stdout: userOutput, stderr: capturedStderr }))
                    return
                }

                let message: DenoResultMessage
                try {
                    message = JSON.parse(resultJson)
                }
                catch {
                    reject(buildError({ message: 'Deno process returned a malformed result', stdout: userOutput, stderr: capturedStderr }))
                    return
                }

                if (message.success) {
                    resolve(message.result)
                }
                else {
                    reject(buildError({ message: message.error, stdout: userOutput, stderr: capturedStderr }))
                }
            })

            child.on('error', (error) => {
                if (settled) {
                    return
                }
                settled = true
                reject(buildError({ message: `Failed to spawn deno (${denoPath}): ${error.message}`, stdout: capturedStdout, stderr: capturedStderr }))
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
        const [childProcess, os] = await Promise.all([
            import('node:child_process'),
            import('node:os'),
        ])
        nodeApisCache = { childProcess, os }
    }
    return nodeApisCache
}

function newResultMarker(): string {
    return `__AP_DENO_RESULT_${nanoid()}__` // Random so it's not guessable and potentially printed by user code
}

async function spawnDeno({ entry, permissions, cwd, memoryLimitMb }: SpawnDenoParams): Promise<{ child: ChildProcessWithoutNullStreams, denoPath: string }> {
    const { childProcess, os } = await getNodeApis()
    const denoPath = resolveDenoPath()
    const child = childProcess.spawn(denoPath, [
        'run',
        '--quiet',
        '--no-prompt',
        // Skip config/workspace discovery from cwd (slow: it walks the
        // monorepo) and forbid remote/npm imports — code is pre-bundled.
        '--no-config',
        '--no-lock',
        '--no-remote',
        '--no-npm',
        `--v8-flags=--max-old-space-size=${memoryLimitMb}`,
        ...toPermissionFlags({ permissions, tmpDir: os.tmpdir() }),
        entry,
    ], {
        cwd,
        env: {
            PATH: process.env.PATH ?? '',
        },
        stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { child, denoPath }
}

function resolveDenoPath(): string {
    if (process.env.AP_DENO_PATH === undefined) {
        throw new Error('AP_DENO_PATH is not set: point it at the deno binary to run the code sandbox')
    }
    return process.env.AP_DENO_PATH
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

function buildRunProgram({ body, marker }: { body: string, marker: string }): string {
    return `
try {
${body}
    console.log(${JSON.stringify(marker)} + JSON.stringify({ success: true, result: result ?? null }));
}
catch (error) {
    console.log(${JSON.stringify(marker)} + JSON.stringify({ success: false, error: (error && error.stack) || String(error) }));
    Deno.exit(1);
}
`
}

function extractResult(stdout: string, marker: string): { userOutput: string, resultJson: string | null } {
    const idx = stdout.lastIndexOf(marker)
    if (idx === -1) {
        return { userOutput: stdout, resultJson: null }
    }
    const after = stdout.slice(idx + marker.length)
    const newline = after.indexOf('\n')
    const resultJson = newline === -1 ? after : after.slice(0, newline)
    const trailing = newline === -1 ? '' : after.slice(newline + 1)
    return { userOutput: stdout.slice(0, idx) + trailing, resultJson }
}

function buildError({ message, stdout, stderr }: BuildErrorParams): Error {
    const parts: string[] = [message ?? 'Code execution failed']
    if (stdout.trim()) {
        parts.push(`\n--- stdout ---\n${stdout.trim()}`)
    }
    if (stderr.trim()) {
        parts.push(`\n--- stderr ---\n${stderr.trim()}`)
    }
    return new Error(parts.join(''))
}

const DEFAULT_MEMORY_LIMIT_MB = 128

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
    permissions: DenoPermission[]
    cwd?: string
    memoryLimitMb?: number
}

type SpawnDenoParams = {
    entry: string
    permissions: DenoPermission[]
    cwd?: string
    memoryLimitMb: number
}

type NodeApis = {
    childProcess: typeof import('node:child_process')
    os: typeof import('node:os')
}

type DenoResultMessage = {
    success: true
    result: unknown
} | {
    success: false
    error: string
}

