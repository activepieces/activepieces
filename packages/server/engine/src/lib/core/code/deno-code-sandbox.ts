import { spawn } from 'node:child_process'
import { readFile, realpath } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { CodeSandbox } from './code-sandbox-common'

const DENO_PATH =  process.env.AP_DENO_PATH ?? join(dirname(require.resolve('deno/bin.cjs')), 'deno')
const MEMORY_LIMIT_MB = 128
const RESULT_MARKER = '__AP_DENO_SANDBOX_RESULT__'

export const denoCodeSandbox: CodeSandbox = {
    async runCodeModule({ codeFilePath, inputs }) {
        // Deno compares permission paths after resolving symlinks (e.g. macOS
        // /var -> /private/var), so the grant must be on the real path.
        const stepDir = await realpath(dirname(codeFilePath))
        const source = await readFile(codeFilePath, 'utf8')

        const program = buildProgram({
            body: `
    const inputs = ${JSON.stringify(inputs)};
    const exportsObj = Object.create(null);
    const module = { exports: exportsObj };
    new Function('exports', 'module', ${JSON.stringify(source)})(exportsObj, module);
    const result = await module.exports.code(inputs);
`,
        })

        return runInDeno({
            program,
            permissionFlags: [
                `--allow-read=${stepDir}`,
                `--allow-write=${stepDir}`,
            ],
            cwd: stepDir,
        })
    },

    // spawns a deno process per eval (~30ms). Pool a long-lived
    // process speaking ndjson over stdio if template resolution gets slow.
    async runScript({ script, scriptContext, functions }) {
        const serializedFunctions = Object.entries(functions).map(([key, value]) => `const ${key} = ${value.toString()};`).join('\n')

        const program = buildProgram({
            body: `
    Object.assign(globalThis, ${JSON.stringify(scriptContext)});
    let result = (0, eval)(${JSON.stringify(`${serializedFunctions}\n${script}`)});
    if (result instanceof Promise) {
        result = await result;
    }
`,
        })

        // No permission flags: Deno denies everything by default,
        // and --no-prompt turns would-be prompts into hard failures.
        return runInDeno({
            program,
            permissionFlags: [],
            cwd: tmpdir(),
        })
    },
}

// The program runs as a Deno module (top-level await is available). The result
// travels back on stdout behind a marker so user console.log output stays separate.
function buildProgram({ body }: { body: string }): string {
    return `
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
        const child = spawn(DENO_PATH, [
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
            reject(buildError({ message: `Failed to spawn deno (${DENO_PATH}): ${error.message}`, stdout: capturedStdout, stderr: capturedStderr }))
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
