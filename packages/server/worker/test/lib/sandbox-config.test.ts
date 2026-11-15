import { describe, it, expect, vi } from 'vitest'

vi.mock('../../src/lib/config/worker-settings', () => ({
    workerSettings: {
        getSettings: vi.fn().mockReturnValue({ SANDBOX_MEMORY_LIMIT: '1048576' }),
    },
}))

import { sandboxConfig } from '../../src/lib/runtime/sandbox-config'

describe('sandboxConfig memory limit', () => {
    it('uses the server-provided limit', () => {
        expect(sandboxConfig.getSandboxSettings().SANDBOX_MEMORY_LIMIT).toBe('1048576')
    })
})
