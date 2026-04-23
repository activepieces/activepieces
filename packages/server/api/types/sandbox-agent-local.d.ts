declare module 'sandbox-agent/local' {
    import { SandboxProvider } from 'sandbox-agent'
    interface LocalProviderOptions {
        host?: string
        port?: number
        token?: string
        binaryPath?: string
        env?: Record<string, string>
    }
    export function local(options?: LocalProviderOptions): SandboxProvider
}
