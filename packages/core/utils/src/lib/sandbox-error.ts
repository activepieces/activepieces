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

    payloadSource: `const toErrorPayload = (value) => {
    try {
        if (value instanceof Error) {
            return { message: value.message, name: value.name, stack: value.stack }
        }
        if (typeof value === 'string') {
            return { message: value }
        }
        return { message: JSON.stringify(value) ?? String(value) }
    }
    catch {
        return { message: 'Code execution failed' }
    }
}`,
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
