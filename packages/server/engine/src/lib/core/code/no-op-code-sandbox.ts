import { spawn } from 'node:child_process'
import { CodeSandbox } from '../../core/code/code-sandbox-common'

const CODE_RUNNER_SCRIPT = `
process.once('message', async function(msg) {
    let settled = false

    process.on('unhandledRejection', (reason) => {
        if (settled) return
        settled = true
        const errMsg = reason instanceof Error ? reason.message : String(reason)
        process.send({ success: false, error: errMsg }, () => process.exit(1))
    })

    process.on('uncaughtException', (err) => {
        if (settled) return
        settled = true
        const errMsg = require('util').inspect(err)
        process.send({ success: false, error: errMsg }, () => process.exit(1))
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
        const errMsg = e instanceof Error ? e.message : String(e)
        process.send({ success: false, error: errMsg }, () => process.exit(0))
    }
})
`

export const noOpCodeSandbox: CodeSandbox = {
    async runCodeModule({ codeFilePath, inputs }) {
        return runInChildProcess(codeFilePath, inputs)
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

async function runInChildProcess(codeFilePath: string, inputs: Record<string, unknown>): Promise<unknown> {
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
                reject(buildError(msg.error, capturedStdout, capturedStderr))
            }
        })

        child.on('close', (code, signal) => {
            if (settled) return
            settled = true
            reject(buildError(`Code process exited with code ${code} and signal ${signal}`, capturedStdout, capturedStderr))
        })

        child.on('error', (error) => {
            if (settled) return
            settled = true
            reject(buildError(error.message, capturedStdout, capturedStderr))
        })

        child.send({ codeFilePath, inputs })
    })
}

function buildError(message: string | undefined, stdout: string, stderr: string): Error {
    const parts: string[] = [message ?? 'Code execution failed']
    if (stdout.trim()) {
        parts.push(`\n--- stdout ---\n${stdout.trim()}`)
    }
    if (stderr.trim()) {
        parts.push(`\n--- stderr ---\n${stderr.trim()}`)
    }
    return new Error(parts.join(''))
}
