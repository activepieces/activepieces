declare module 'sandbox-agent/cloudflare' {
    import { SandboxProvider } from 'sandbox-agent'
    interface CloudflareProviderOptions {
        sdk: unknown
        create?: Record<string, unknown> | (() => Record<string, unknown> | Promise<Record<string, unknown>>)
        agentPort?: number
    }
    export function cloudflare(options: CloudflareProviderOptions): SandboxProvider
}
