import { createRequestLogger, initLogger } from 'evlog'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApLogger, apLogger } from '../src/ap-logger'
import { wideEvent } from '../src/wide-event'

function parsedProtoPayload(): Record<string, unknown> {
    return JSON.parse('{"__proto__":{"polluted":{"nested":true}}}')
}

function leakedKeysAfter({ step }: { step: (log: ApLogger) => void }): string[] {
    const logger = createRequestLogger({ method: 'POST', path: '/v1/test', requestId: 'req_proto' })
    wideEvent.run({ logger, fn: () => step(apLogger.create({})) })
    const leaked = Object.keys(Object.prototype)
    leaked.forEach((key) => Reflect.deleteProperty(Object.prototype, key))
    return leaked
}

describe('request-scoped logging of parsed input', () => {
    beforeEach(() => {
        initLogger({ env: { service: 'prototype-pollution-test' }, pretty: false, redact: false })
        vi.spyOn(console, 'info').mockImplementation(() => undefined)
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('never copies a parsed __proto__ key onto Object.prototype', () => {
        const leaks = [
            leakedKeysAfter({ step: (log) => log.info(parsedProtoPayload(), 'top-level fields') }),
            leakedKeysAfter({
                step: (log) => {
                    log.info({ payload: { seen: true } }, 'seed an object under payload')
                    log.info({ payload: parsedProtoPayload() }, 'merge into the existing payload')
                },
            }),
            leakedKeysAfter({ step: (log) => log.child(parsedProtoPayload()) }),
        ]

        expect(leaks).toEqual([[], [], []])
    })
})
