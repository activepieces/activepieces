import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { readFile, realpath } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { CodeSandbox } from './code-sandbox-common'

const MEMORY_LIMIT_MB = 128
const getDenoPath = (): string => process.env.AP_DENO_PATH ?? join(dirname(require.resolve('deno/bin.cjs')), 'deno')
const newResultMarker = (): string => `__AP_DENO_RESULT_${randomUUID().replace(/-/g, '')}__` // Add random uuid so it's not guessable and potentionnaly written by a user in the source 


export function denoCodeSandbox(permissions: DenoPermission[]): CodeSandbox {
    return {
        async runCodeModule({ codeFilePath, inputs }) {
            // Deno compares permission paths after resolving symlinks (e.g. macOS
            // /var -> /private/var), so the grant must be on the real path.
            const stepDir = await realpath(dirname(codeFilePath))
            const source = await readFile(codeFilePath, 'utf8')

            const marker = newResultMarker()
            const program = buildProgram({
                marker,
                requireBase: pathToFileURL(codeFilePath).href,
                body: `
    const inputs = ${JSON.stringify(inputs)};
    const exportsObj = Object.create(null);
    const module = { exports: exportsObj };
    new Function('exports', 'module', 'require', ${JSON.stringify(source)})(exportsObj, module, require);
    const result = await module.exports.code(inputs);
`,
            })

            return runInDeno({
                program,
                marker,
                permissionFlags: toFlags({ permissions }),
                cwd: stepDir,
            })
        },

        async runScript({ script, scriptContext, functions }) {
            const serializedFunctions = Object.entries(functions).map(([key, value]) => `const ${key} = ${value.toString()};`).join('\n')

            const marker = newResultMarker()
            const program = buildProgram({
                marker,
                requireBase: pathToFileURL(join(tmpdir(), 'script.js')).href,
                body: `
    Object.assign(globalThis, ${JSON.stringify(scriptContext)});
    let result = (0, eval)(${JSON.stringify(`${serializedFunctions}\n${script}`)});
    if (result instanceof Promise) {
        result = await result;
    }
`,
            })

            return runInDeno({
                program,
                marker,
                permissionFlags: [],
                cwd: tmpdir(),
            })
        },
    }
}

function toFlags({ permissions }: { permissions: DenoPermission[] }): string[] {
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
                return [`--allow-write=${tmpdir()}`]
            case DenoPermission.READ_TMP:
                return [`--allow-write=${tmpdir()}`]
            case DenoPermission.ALL:
            default:
                return []
        }
    })
}

function buildProgram({ body, requireBase, marker }: { body: string, requireBase: string, marker: string }): string {
    return `
import { createRequire } from 'node:module';
const require = createRequire(${JSON.stringify(requireBase)});
globalThis.require = require;
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

async function runInDeno({ program, marker, permissionFlags, cwd }: RunInDenoParams): Promise<unknown> {
    return new Promise((resolve, reject) => {
        const denoPath = getDenoPath()
        const child = spawn(denoPath, [
            'run',
            '--quiet',
            '--no-prompt',
            // Skip config/workspace discovery from cwd (slow: it walks the
            // monorepo) and forbid remote/npm imports — code is pre-bundled.
            '--no-config',
            '--no-lock',
            '--no-remote',
            '--no-npm',
            `--v8-flags=--max-old-space-size=${MEMORY_LIMIT_MB}`,
            ...permissionFlags,
            '-',
        ], {
            cwd,
            env: {
                PATH: process.env.PATH ?? '',
            },
            stdio: ['pipe', 'pipe', 'pipe'],
        })

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

            let message: SandboxResultMessage
            try {
                message = JSON.parse(resultJson)
            }
            catch {
                reject(buildError({ message: 'Sandbox returned a malformed result', stdout: userOutput, stderr: capturedStderr }))
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

        child.stdin.end(program)
    })
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

export enum DenoPermission {
    ALL = 'ALL',
    NET = 'NET',
    ENV = 'ENV',
    RUN = 'RUN',
    SYS = 'SYS',
    WRITE_TMP = 'WRITE_TMP',
    READ_TMP = 'READ_TMP',
}

type RunInDenoParams = {
    program: string
    marker: string
    permissionFlags: string[]
    cwd?: string
}

type SandboxResultMessage = {
    success: true
    result: unknown
} | {
    success: false
    error: string
}

type BuildErrorParams = {
    message: string | undefined
    stdout: string
    stderr: string
}
