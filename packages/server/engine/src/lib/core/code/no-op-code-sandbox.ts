import { spawn } from 'node:child_process'
import { CodeSandbox } from '../../core/code/code-sandbox-common'

const CODE_RUNNER_SCRIPT = `
process.once('message', async function(msg) {
    let settled = false

    const inspect = require('util').inspect

    process.on('unhandledRejection', (reason) => {
        if (settled) return
        settled = true
        process.send({ success: false, error: inspect(reason) }, () => process.exit(1))
    })

    process.on('uncaughtException', (err) => {
        if (settled) return
        settled = true
        process.send({ success: false, error: inspect(err) }, () => process.exit(1))
    })

    try {
        const mod = require(msg.codeFilePath)
        const result = await mod.code(msg.inputs)

        // Yield to the event loop so unhandledRejection fires before we send success
        await new Promise(resolve => setImmediate(resolve))

        if (settled) return
        settled = true
        process.send({ success: true, result: JSON.parse(JSON.stringify(result ?? null)) }, () => process.exit(0))
    } catch(e) {
        if (settled) return
        settled = true
        process.send({ success: false, error: inspect(e) }, () => process.exit(0))
    }
})
`

async function runInChildProcess({ codeFilePath, inputs }: { codeFilePath: string, inputs: Record<string, unknown> }): Promise<unknown> {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ['--eval', CODE_RUNNER_SCRIPT], {
            stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        })

        let capturedStdout = ''
        let capturedStderr = ''

        child.stdout?.on('data', (data: Buffer) => {
            const text = data.toString()
            capturedStdout += text
            console.log(text.trimEnd())
        })

        child.stderr?.on('data', (data: Buffer) => {
            const text = data.toString()
            capturedStderr += text
            console.error(text.trimEnd())
        })

        let settled = false

        child.on('message', (msg: { success: boolean, result?: unknown, error?: string }) => {
            if (settled) return
            settled = true
            if (msg.success) {
                resolve(msg.result)
            }
            else {
                reject(buildError({ message: msg.error, stdout: capturedStdout, stderr: capturedStderr }))
            }
        })

        child.on('close', (code, signal) => {
            if (settled) return
            settled = true
            reject(buildError({ message: `Code process exited with code ${code} and signal ${signal}`, stdout: capturedStdout, stderr: capturedStderr }))
        })

        child.on('error', (error) => {
            if (settled) return
            settled = true
            reject(buildError({ message: error.message, stdout: capturedStdout, stderr: capturedStderr }))
        })

        child.send({ codeFilePath, inputs })
    })
}

function buildError({ message, stdout, stderr }: { message: string | undefined, stdout: string, stderr: string }): Error {
    const parts: string[] = [message ?? 'Code execution failed']
    if (stdout.trim()) {
        parts.push(`\n--- stdout ---\n${stdout.trim()}`)
    }
    if (stderr.trim()) {
        parts.push(`\n--- stderr ---\n${stderr.trim()}`)
    }
    return new Error(parts.join(''))
}

export const noOpCodeSandbox: CodeSandbox = {
    async runCodeModule({ codeFilePath, inputs }) {
        return runInChildProcess({ codeFilePath, inputs })
    },

    async runScript({ script, scriptContext, functions }) {
        const newContext = {
            ...scriptContext,
            ...functions,
        }
        const params = Object.keys(newContext)
        const args = Object.values(newContext)
        const body = `return (${script})`
        const fn = Function(...params, body)
        return fn(...args)
    },
}
