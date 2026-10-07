import { spawn } from 'node:child_process'
import { sandboxError, SandboxErrorPayload } from '@activepieces/core-utils'
import { CodeSandbox } from '../../core/code/code-sandbox-common'

const CODE_RUNNER_SCRIPT = `
process.once('message', async function(msg) {
    let settled = false

    ${sandboxError.payloadSource}

    process.on('unhandledRejection', (reason) => {
        if (settled) return
        settled = true
        process.send({ success: false, error: toErrorPayload(reason) }, () => process.exit(1))
    })

    process.on('uncaughtException', (err) => {
        if (settled) return
        settled = true
        process.send({ success: false, error: toErrorPayload(err) }, () => process.exit(1))
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
        process.send({ success: false, error: toErrorPayload(e) }, () => process.exit(0))
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

        child.on('message', (msg: { success: boolean, result?: unknown, error?: SandboxErrorPayload }) => {
            if (settled) return
            settled = true
            if (msg.success) {
                resolve(msg.result)
            }
            else {
                reject(sandboxError.build({ error: msg.error, stdout: capturedStdout, stderr: capturedStderr }))
            }
        })

        child.on('close', (code, signal) => {
            if (settled) return
            settled = true
            reject(sandboxError.build({ error: `Code process exited with code ${code} and signal ${signal}`, stdout: capturedStdout, stderr: capturedStderr }))
        })

        child.on('error', (error) => {
            if (settled) return
            settled = true
            reject(sandboxError.build({ error: error.message, stdout: capturedStdout, stderr: capturedStderr }))
        })

        if (typeof child.send !== 'function') {
            return
        }

        child.send({ codeFilePath, inputs })
    })
}

export const noOpCodeSandbox: CodeSandbox = {
    async runCodeModule({ codeFilePath, inputs }) {
        return runInChildProcess({ codeFilePath, inputs })
    },

    async runScript({ script, scriptContext, functions }) {
        const session = await noOpCodeSandbox.createScriptSession({ scriptContext, functions })
        try {
            return await session.run(script)
        }
        finally {
            session.dispose()
        }
    },

    async createScriptSession({ scriptContext, functions }) {
        const newContext: Record<string, unknown> = {
            ...scriptContext,
            ...functions,
        }
        let disposed = false
        return {
            run: async (script: string) => {
                if (disposed) {
                    throw new Error('Script session has been disposed')
                }
                const body = `return (${script})`
                const fn = Function(...Object.keys(newContext), body)
                return fn(...Object.values(newContext))
            },
            setGlobal: async (key: string, value: unknown, noOverwrite = true) => {
                if (noOverwrite && key in newContext) {
                    return
                }
                newContext[key] = value
            },
            dispose: () => {
                disposed = true
            },
        }
    },
}
