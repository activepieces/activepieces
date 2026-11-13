import { isNil, isString } from './utils'

export const sandboxError = {
    build({ error, stdout, stderr }: BuildSandboxErrorParams): Error {
        const payload = isString(error) ? { message: error } : error
        const builtError = new Error(payload?.message ?? 'Code execution failed')
        if (!isNil(payload?.name)) {
            builtError.name = payload.name
        }
        builtError.stack = `${payload?.stack ?? builtError.stack}${formatCapturedOutput({ stdout, stderr })}`
        return builtError
    },

    payloadSourceFor({ tmpDir }: PayloadSourceParams = {}): string {
        return `const __AP_TMP_DIR__ = ${JSON.stringify(tmpDir ?? null)};
const toErrorPayload = (value) => {
    try {
        if (value instanceof Error) {
            let message = value.message
            const accessMatch = __AP_TMP_DIR__ !== null && typeof Deno !== 'undefined' && value.name === 'NotCapable'
                ? message.match(/Requires (read|write) access/)
                : null
            if (accessMatch) {
                const operation = accessMatch[1]
                const tmpGranted = Deno.permissions.querySync({ name: operation, path: __AP_TMP_DIR__ }).state === 'granted'
                if (operation === 'write') {
                    message += tmpGranted
                        ? '. Only os.tmpdir() is writable from a code step.'
                        : '. Writes are not available to a code step in this execution mode.'
                }
                else {
                    message += tmpGranted
                        ? ". Only os.tmpdir() and the step's own directory are readable from a code step."
                        : ". Only the step's own directory is readable by a code step in this execution mode."
                }
            }
            return { message, name: value.name, stack: value.stack }
        }
        if (typeof value === 'string') {
            return { message: value }
        }
        return { message: JSON.stringify(value) ?? String(value) }
    }
    catch {
        return { message: 'Code execution failed' }
    }
}`
    },
}

function formatCapturedOutput({ stdout, stderr }: { stdout: string, stderr: string }): string {
    const parts: string[] = []
    if (stdout.trim()) {
        parts.push(`\n--- stdout ---\n${stdout.trim()}`)
    }
    if (stderr.trim()) {
        parts.push(`\n--- stderr ---\n${stderr.trim()}`)
    }
    return parts.join('')
}

export type SandboxErrorPayload = {
    message: string
    name?: string
    stack?: string
}

type BuildSandboxErrorParams = {
    error: SandboxErrorPayload | string | undefined
    stdout: string
    stderr: string
}

type PayloadSourceParams = {
    tmpDir?: string
}
