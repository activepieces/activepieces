declare module 'sandbox-agent/e2b' {
    import { SandboxProvider } from 'sandbox-agent'
    interface E2BProviderOptions {
        create?: Record<string, unknown> | (() => Record<string, unknown> | Promise<Record<string, unknown>>)
        connect?: Record<string, unknown> | ((sandboxId: string) => Record<string, unknown> | Promise<Record<string, unknown>>)
        template?: string | (() => string | Promise<string>)
        agentPort?: number
        timeoutMs?: number
        autoPause?: boolean
    }
    export function e2b(options?: E2BProviderOptions): SandboxProvider
}
