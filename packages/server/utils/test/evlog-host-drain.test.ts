import os from 'os'
import { describe, expect, it, vi } from 'vitest'
import { initLogger, log } from 'evlog'
import type { DrainContext, WideEvent } from 'evlog'
import { evlogSetup } from '../src/evlog-setup'

function makeCtx(event: Partial<WideEvent>): DrainContext {
    return { event: event as WideEvent }
}

describe('evlogSetup.wrapDrainWithHost', () => {
    it('stamps os.hostname() on events that arrive with no host', async () => {
        const inner = vi.fn().mockResolvedValue(undefined)
        const wrapped = evlogSetup.wrapDrainWithHost(inner)

        const ctx = makeCtx({ event: 'job.failed', level: 'error' } as Partial<WideEvent>)
        await wrapped(ctx)

        expect(inner).toHaveBeenCalledOnce()
        expect(inner.mock.calls[0][0].event.host).toBe(os.hostname())
    })

    it('preserves a host set explicitly at the call site (system.snapshot pattern)', async () => {
        const inner = vi.fn().mockResolvedValue(undefined)
        const wrapped = evlogSetup.wrapDrainWithHost(inner)

        const ctx = makeCtx({ event: 'system.snapshot', host: 'explicit-host-abc' } as Partial<WideEvent>)
        await wrapped(ctx)

        expect(inner.mock.calls[0][0].event.host).toBe('explicit-host-abc')
    })

    it('propagates errors thrown by the inner drain', async () => {
        const inner = vi.fn().mockRejectedValue(new Error('drain boom'))
        const wrapped = evlogSetup.wrapDrainWithHost(inner)

        await expect(wrapped(makeCtx({ event: 'x' } as Partial<WideEvent>))).rejects.toThrow('drain boom')
    })

    it('leaves an empty string host in place (treated as caller intent, not absence)', async () => {
        const inner = vi.fn().mockResolvedValue(undefined)
        const wrapped = evlogSetup.wrapDrainWithHost(inner)

        const ctx = makeCtx({ event: 'x', host: '' } as Partial<WideEvent>)
        await wrapped(ctx)

        expect(inner.mock.calls[0][0].event.host).toBe('')
    })
})

describe('evlog log.error path (worker shape)', () => {
    it('a plain log.error emitted through evlog gets host stamped by the drain wrapper', async () => {
        const captured: DrainContext[] = []
        const captureDrain = async (ctx: DrainContext): Promise<void> => {
            captured.push({ event: { ...ctx.event } })
        }

        initLogger({
            env: { service: 'test-worker', version: '0.0.0', environment: 'test' },
            minLevel: 'info',
            drain: evlogSetup.wrapDrainWithHost(captureDrain),
        })

        log.error({ event: 'job.failed', job: { id: 'j1', type: 'EXECUTE_FLOW' }, error: 'boom' }, 'job.failed')

        await new Promise(resolve => setImmediate(resolve))

        expect(captured).toHaveLength(1)
        expect(captured[0].event.host).toBe(os.hostname())
        expect(captured[0].event.event).toBe('job.failed')
        expect(captured[0].event.level).toBe('error')
    })
})
