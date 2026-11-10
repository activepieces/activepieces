import Fastify, { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest'
import { prototypePollutionGuard } from '../../../../src/app/helper/prototype-pollution-guard'

describe('prototypePollutionGuard', () => {
    let app: FastifyInstance
    let exitSpy: MockInstance<typeof process.exit>
    let stderrSpy: MockInstance<typeof process.stderr.write>

    beforeEach(async () => {
        exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
            Reflect.deleteProperty(Object.prototype, 'polluted')
            throw new Error('process.exit called')
        })
        stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
        app = Fastify()
        prototypePollutionGuard.register({ app })
        app.get('/clean', async () => ({ ok: true }))
        app.get('/pollute', async () => {
            Reflect.set(Object.prototype, 'polluted', { nested: true })
            return { ok: true }
        })
        await app.ready()
    })

    afterEach(async () => {
        Reflect.deleteProperty(Object.prototype, 'polluted')
        await app.close()
        vi.restoreAllMocks()
    })

    it('leaves the process alone when Object.prototype is untouched', async () => {
        const response = await app.inject({ method: 'GET', url: '/clean' })

        expect(response.statusCode).toBe(200)
        expect(exitSpy).not.toHaveBeenCalled()
    })

    it('exits and names the polluting route when a request adds a key to Object.prototype', async () => {
        await app.inject({ method: 'GET', url: '/pollute' })

        expect(exitSpy).toHaveBeenCalledWith(1)
        const message = stderrSpy.mock.calls.map((call) => String(call[0])).join('')
        expect(message).toContain('keys=polluted:object')
        expect(message).toContain('source=GET /pollute')
    })
})
