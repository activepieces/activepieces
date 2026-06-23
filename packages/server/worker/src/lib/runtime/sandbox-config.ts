import { type SandboxPoolSettings } from '@activepieces/sandbox-pool'
import { system, WorkerSystemProp } from '../config/configs'
import { workerSettings } from '../config/worker-settings'

export const sandboxConfig = {
    getCacheBasePath(): string {
        return system.get(WorkerSystemProp.CACHE_BASE_PATH) ?? 'cache'
    },
    // The worker's runtime settings mapped to what the pool reads. REUSE_SANDBOX is an env-only
    // override not present in WorkerSettings, so it is merged in here. Returns a fresh object each
    // call so the pool always sees the latest settings (the worker refetches them on reconnect).
    getSandboxPoolSettings(): SandboxPoolSettings {
        return {
            ...workerSettings.getSettings(),
            REUSE_SANDBOX: system.get(WorkerSystemProp.REUSE_SANDBOX),
        }
    },
}
