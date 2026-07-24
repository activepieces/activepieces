import { spawn } from 'node:child_process'
import { readFile, realpath } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { CodeSandbox } from './code-sandbox-common'

const getDenoPath = (): string => process.env.AP_DENO_PATH ?? join(dirname(require.resolve('deno/bin.cjs')), 'deno')
const MEMORY_LIMIT_MB = 128
const RESULT_MARKER = '__AP_DENO_SANDBOX_RESULT__'

export function denoCodeSandbox(permissions: DenoPermission[]): CodeSandbox {
    return {
        async runCodeModule({ codeFilePath, inputs }) {
            // Deno compares permission paths after resolving symlinks (e.g. macOS
            // /var -> /private/var), so the grant must be on the real path.
            const stepDir = await realpath(dirname(codeFilePath))
            const source = await readFile(codeFilePath, 'utf8')

            const program = buildProgram({
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
                permissionFlags: toFlags({ permissions, stepDir }),
                cwd: stepDir,
            })
        },

        // Expression evaluation never needs fs/net, so it always runs with no
        // permissions regardless of what the caller granted for code modules.
        async runScript({ script, scriptContext, functions }) {
            const serializedFunctions = Object.entries(functions).map(([key, value]) => `const ${key} = ${value.toString()};`).join('\n')

            const program = buildProgram({
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
                permissionFlags: [],
                cwd: tmpdir(),
            })
        },
    }
}

function toFlags({ permissions, stepDir }: { permissions: DenoPermission[], stepDir?: string }): string[] {
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
            case DenoPermission.READ_ALL:
                return ['--allow-read']
            case DenoPermission.WRITE_TMP:
                return [`--allow-write=${tmpdir()}`]
            case DenoPermission.READ_STEP_DIR:
                return stepDir ? [`--allow-read=${stepDir}`] : []
            case DenoPermission.WRITE_STEP_DIR:
                return stepDir ? [`--allow-write=${stepDir}`] : []
            case DenoPermission.ALL:
                return []
        }
    })
}

// The program runs as a Deno module (top-level await is available). A CJS-style
// `require` is provided so esbuild bundles that reference node builtins
// (require("node:crypto")) resolve. The result travels back on stdout behind a
// marker so user console.log output stays separate.
function buildProgram({ body, requireBase }: { body: string, requireBase: string }): string {
    return `
import { createRequire } from 'node:module';
const require = createRequire(${JSON.stringify(requireBase)});
globalThis.require = require;
try {
${body}
    console.log(${JSON.stringify(RESULT_MARKER)} + JSON.stringify({ success: true, result: result ?? null }));
}
catch (error) {
    console.log(${JSON.stringify(RESULT_MARKER)} + JSON.stringify({ success: false, error: (error && error.stack) || String(error) }));
    Deno.exit(1);
}
`
}

async function runInDeno({ program, permissionFlags, cwd }: RunInDenoParams): Promise<unknown> {
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

            const { userOutput, resultLine } = splitResultFromStdout(capturedStdout)
            if (userOutput.trim()) {
                console.log(userOutput.trimEnd())
            }

            if (!resultLine) {
                reject(buildError({ message: `Deno process exited with code ${code} and signal ${signal} without returning a result`, stdout: userOutput, stderr: capturedStderr }))
                return
            }

            const message: SandboxResultMessage = JSON.parse(resultLine.slice(RESULT_MARKER.length))
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

function splitResultFromStdout(stdout: string): { userOutput: string, resultLine: string | null } {
    const lines = stdout.split('\n')
    const resultLine = lines.filter((line) => line.startsWith(RESULT_MARKER)).at(-1) ?? null
    const userOutput = lines.filter((line) => !line.startsWith(RESULT_MARKER)).join('\n')
    return { userOutput, resultLine }
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
    READ_ALL = 'READ_ALL',
    WRITE_TMP = 'WRITE_TMP',
    READ_STEP_DIR = 'READ_STEP_DIR',
    WRITE_STEP_DIR = 'WRITE_STEP_DIR',
}

type RunInDenoParams = {
    program: string
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
