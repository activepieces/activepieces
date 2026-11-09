import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { nanoid } from 'nanoid'
import { sandboxError, SandboxErrorPayload } from './sandbox-error'
import { tryCatch } from './try-catch'

export const deno = {
    /**
     * Runs a program body in a one-shot Deno process. The body must assign its
     * output to a `result` variable. Resolves with the result, or rejects with
     * an Error carrying the process stdout/stderr.
     */
    async run({ body, data, permissions, cwd, memoryLimitMb = DEFAULT_MEMORY_LIMIT_MB, allowReadPaths = [], resolveNodeModules = false, env = {}, denoDir, timeoutMs }: DenoProgramParams): Promise<unknown> {
        const keepDenoDir = denoDir !== undefined
        const { os } = await getNodeApis()
        const dataDir = data === undefined ? undefined : await writeDataFile(data)
        const dataFile = dataDir === undefined ? undefined : `${dataDir}/${DATA_FILE_NAME}`
        const { data: spawned, error: spawnError } = await tryCatch(() => spawnDeno({ entry: '-', dataFile, permissions, cwd, memoryLimitMb, allowReadPaths, resolveNodeModules, env, denoDir }))
        if (spawnError !== null) {
            if (dataDir !== undefined) {
                await removeDir(dataDir)
            }
            throw spawnError
        }
        const { child, denoPath, denoDir: resolvedDenoDir } = spawned
        child.stdin.end(buildRunProgram({ body, tmpDir: os.tmpdir() }))
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

                if (message.success === false) {
                    reject(sandboxError.build({ error: message.error, stdout: userOutput, stderr: capturedStderr }))
                }
                else if (code !== 0) {
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

    async createSession({ bootstrapBody, permissions, cwd, memoryLimitMb = DEFAULT_MEMORY_LIMIT_MB, env = {}, idleTimeoutMs = DEFAULT_SESSION_IDLE_TIMEOUT_MS }: DenoSessionParams): Promise<DenoSession> {
        const marker = newResultMarker()
        const { os } = await getNodeApis()
        const { child, denoPath, denoDir } = await spawnDeno({
            entry: { body: buildSessionProgram({ bootstrapBody, marker, tmpDir: os.tmpdir() }) },
            permissions,
            cwd,
            memoryLimitMb,
            allowReadPaths: [],
            resolveNodeModules: false,
            env,
        })

        const pending = new Map<string, PendingSessionCommand>()
        let nextCommandId = 0
        let alive = true
        let stdoutBuffer = ''
        let capturedStderr = ''
        let idleTimer: ReturnType<typeof setTimeout> | null = null

        const refreshWatchdog = (): void => {
            if (idleTimer !== null) {
                clearTimeout(idleTimer)
                idleTimer = null
            }
            if (!alive || pending.size === 0) {
                return
            }
            idleTimer = setTimeout(() => {
                child.kill('SIGKILL')
                failAllPending(sandboxError.build({ error: `Deno session made no progress for ${idleTimeoutMs}ms`, stdout: '', stderr: capturedStderr }))
            }, idleTimeoutMs)
        }

        const settleResponse = (line: string): void => {
            let message: SessionReply | null = null
            try {
                message = JSON.parse(line.slice(marker.length))
            }
            catch {
                return
            }
            if (message === null) {
                return
            }
            const command = pending.get(message.id)
            if (command === undefined) {
                return
            }
            pending.delete(message.id)
            refreshWatchdog()
            if (message.success === true) {
                command.resolve(message.result)
            }
            else {
                command.reject(sandboxError.build({ error: message.error, stdout: '', stderr: capturedStderr }))
            }
            capturedStderr = ''
        }

        child.stdout.setEncoding('utf8')
        child.stderr.setEncoding('utf8')

        child.stdout.on('data', (chunk: string) => {
            stdoutBuffer += chunk
            let newline = stdoutBuffer.indexOf('\n')
            while (newline !== -1) {
                const line = stdoutBuffer.slice(0, newline)
                stdoutBuffer = stdoutBuffer.slice(newline + 1)
                if (line.startsWith(marker)) {
                    settleResponse(line)
                }
                else if (line.trim()) {
                    console.log(line)
                }
                newline = stdoutBuffer.indexOf('\n')
            }
        })

        child.stderr.on('data', (chunk: string) => {
            capturedStderr += chunk
            console.error(chunk.trimEnd())
        })

        const failAllPending = (error: Error): void => {
            alive = false
            if (idleTimer !== null) {
                clearTimeout(idleTimer)
                idleTimer = null
            }
            for (const command of pending.values()) {
                command.reject(error)
            }
            pending.clear()
        }

        child.on('close', (code, signal) => {
            void removeDir(denoDir)
            failAllPending(sandboxError.build({ error: `Deno session exited with code ${code} and signal ${signal}`, stdout: '', stderr: capturedStderr }))
        })

        child.on('error', (error) => {
            void removeDir(denoDir)
            failAllPending(sandboxError.build({ error: `Failed to spawn deno (${denoPath}): ${error.message}`, stdout: '', stderr: capturedStderr }))
        })

        child.stdin.on('error', (error) => {
            child.kill('SIGKILL')
            failAllPending(sandboxError.build({ error: `Deno session stdin error: ${error.message}`, stdout: '', stderr: capturedStderr }))
        })

        const send = (command: SessionCommandBody): Promise<unknown> => {
            if (!alive) {
                return Promise.reject(sandboxError.build({ error: 'Deno session is not running', stdout: '', stderr: capturedStderr }))
            }
            const id = String(nextCommandId++)
            let payload: string
            try {
                payload = `${JSON.stringify({ ...command, id })}\n`
            }
            catch (stringifyError) {
                return Promise.reject(stringifyError)
            }
            return new Promise((resolve, reject) => {
                pending.set(id, { resolve, reject })
                refreshWatchdog()
                child.stdin.write(payload, (writeError) => {
                    if (writeError && pending.delete(id)) {
                        refreshWatchdog()
                        reject(sandboxError.build({ error: `Failed to write to deno session: ${writeError.message}`, stdout: '', stderr: capturedStderr }))
                    }
                })
            })
        }

        return {
            setGlobal: async ({ key, value }: SessionSetGlobalParams): Promise<void> => {
                await send({ kind: 'set', key, value })
            },
            run: ({ script }: SessionRunParams): Promise<unknown> => {
                return send({ kind: 'run', script })
            },
            isAlive: (): boolean => alive,
            dispose: (): void => {
                alive = false
                child.kill('SIGKILL')
            },
        }
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

function newResultMarker(): string {
    return `__AP_DENO_RESULT_${nanoid()}__`
}

async function writeDataFile(data: unknown): Promise<string> {
    const { os, fs } = await getNodeApis()
    const dataDir = await fs.mkdtemp(`${os.tmpdir()}/ap-deno-data-`)
    const { error } = await tryCatch(() => fs.writeFile(`${dataDir}/${DATA_FILE_NAME}`, JSON.stringify(data) ?? 'null', 'utf8'))
    if (error !== null) {
        await removeDir(dataDir)
        throw error
    }
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
    const entryArg = typeof entry === 'string' ? entry : `${resolvedDenoDir}/main.mjs`
    if (typeof entry !== 'string') {
        const { error } = await tryCatch(() => fs.writeFile(entryArg, entry.body))
        if (error !== null) {
            if (denoDir === undefined) {
                await removeDir(resolvedDenoDir)
            }
            throw error
        }
    }
    const child = childProcess.spawn(denoPath, [
        'run',
        '--quiet',
        '--no-prompt',
        '--no-config',
        '--no-lock',
        '--no-remote',
        resolveNodeModules ? '--node-modules-dir=manual' : '--no-npm',
        ...(memoryLimitMb === null ? [] : [`--v8-flags=--max-old-space-size=${memoryLimitMb}`]),
        ...toPermissionFlags({ permissions, tmpDir: os.tmpdir() }),
        ...permissions.includes(DenoPermission.ALL) ? [] : readPaths.map((path) => `--allow-read=${path}`),
        entryArg,
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

function buildRunProgram({ body, tmpDir }: { body: string, tmpDir: string }): string {
    return `
${sandboxError.payloadSourceFor({ tmpDir })}
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
    if (settled) {
        const payload = toErrorPayload(event.reason);
        console.error(\`Unhandled rejection after the step already returned a result: \${payload.message}\`);
        return;
    }
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

/**
 * The session child's program (ESM, so its own bindings are hidden from the
 * scripts it evaluates in global scope).
 * stdin:  {"kind":"run","script":"step_1.a + 1","id":"0"}
 * stdout: MARKER{"id":"0","success":true,"result":42}
 */
function buildSessionProgram({ bootstrapBody, marker, tmpDir }: { bootstrapBody: string, marker: string, tmpDir: string }): string {
    return `
${sandboxError.payloadSourceFor({ tmpDir })}
${bootstrapBody}
${SESSION_REPLY_CHANNEL(marker)}
${SESSION_REJECTION_TRACKING}
${SESSION_SCRIPT_RUNNER}
${SESSION_COMMAND_LOOP}
`
}

/**
 * MARKER{"id":"0","success":true,"result":42}  -> protocol reply
 * hello from a script's console.log            -> forwarded as user output
 * console.log is bound up front so a script overwriting it can't break this.
 */
const SESSION_REPLY_CHANNEL = (marker: string): string => `
const print = console.log.bind(console);
const reply = (payload) => {
    print(${JSON.stringify(marker)} + JSON.stringify(payload));
};`

/**
 * e.g. `Promise.reject('late')` inside a run fails that run only;
 * the process stays alive (the one-shot runner exits instead).
 */
const SESSION_REJECTION_TRACKING = `
let failCurrentRun = null;
globalThis.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    if (failCurrentRun) {
        failCurrentRun(event.reason);
    }
    else {
        console.error('Unhandled rejection in deno session:', event.reason);
    }
});`

/**
 * (0, eval)('(' + script + ')'): global scope, and the parens make
 * {"where": "a"} an object literal, not a block. The setTimeout(0) lets a
 * promise the script left behind reject before success is reported.
 */
const SESSION_SCRIPT_RUNNER = `
const runScript = (script) => new Promise((resolve, reject) => {
    failCurrentRun = reject;
    Promise.resolve()
        .then(() => (0, eval)('(' + script + ')'))
        .then(async (value) => {
            await new Promise((tick) => setTimeout(tick, 0));
            resolve(value);
        })
        .catch(reject);
});`

/**
 * {"kind":"set","key":"step_1","value":{...}}  -> globalThis.step_1 = {...}
 * {"kind":"run","script":"step_1.a"}           -> reply success/failure
 * Runs are awaited one at a time, so failCurrentRun is the only run in flight.
 * Line splitting is hand-rolled: --no-remote rules out std's TextLineStream.
 */
const SESSION_COMMAND_LOOP = `
const decoder = new TextDecoder();
let buffered = '';
for await (const chunk of Deno.stdin.readable) {
    buffered += decoder.decode(chunk, { stream: true });
    let newline = buffered.indexOf('\\n');
    while (newline !== -1) {
        const line = buffered.slice(0, newline);
        buffered = buffered.slice(newline + 1);
        newline = buffered.indexOf('\\n');
        if (line.trim() === '') {
            continue;
        }
        let command;
        try {
            command = JSON.parse(line);
        }
        catch {
            continue;
        }
        if (command.kind === 'set') {
            globalThis[command.key] = command.value;
            reply({ id: command.id, success: true, result: null });
            continue;
        }
        try {
            const result = await runScript(command.script);
            reply({ id: command.id, success: true, result: result ?? null });
        }
        catch (error) {
            reply({ id: command.id, success: false, error: toErrorPayload(error) });
        }
        finally {
            failCurrentRun = null;
        }
    }
}`

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
const DEFAULT_SESSION_IDLE_TIMEOUT_MS = 30_000
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
    memoryLimitMb?: number | null
    allowReadPaths?: string[]
    resolveNodeModules?: boolean
    env?: Record<string, string>
    denoDir?: string
    timeoutMs?: number
}

export type DenoSession = {
    setGlobal(params: SessionSetGlobalParams): Promise<void>
    run(params: SessionRunParams): Promise<unknown>
    isAlive(): boolean
    dispose(): void
}

type DenoSessionParams = {
    bootstrapBody: string
    permissions: DenoPermission[]
    cwd?: string
    memoryLimitMb?: number
    env?: Record<string, string>
    idleTimeoutMs?: number
}

type SessionSetGlobalParams = {
    key: string
    value: unknown
}

type SessionRunParams = {
    script: string
}

type SessionCommandBody =
    | { kind: 'set', key: string, value: unknown }
    | { kind: 'run', script: string }

type SessionReply =
    | { id: string, success: true, result: unknown }
    | { id: string, success: false, error: SandboxErrorPayload }

type PendingSessionCommand = {
    resolve(value: unknown): void
    reject(error: Error): void
}

type SpawnDenoParams = {
    entry: string | { body: string }
    dataFile?: string
    permissions: DenoPermission[]
    cwd?: string
    memoryLimitMb: number | null
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

