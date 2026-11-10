import { FastifyInstance } from 'fastify'

const CHECK_INTERVAL_MS = 5_000

function register({ app }: { app: FastifyInstance }): void {
    const baseline = new Set(Object.keys(Object.prototype))
    app.addHook('onResponse', (request, reply, done) => {
        exitIfPolluted({ baseline, source: `${request.method} ${request.routeOptions.url ?? 'unmatched-route'} requestId=${request.id} status=${reply.statusCode}` })
        done()
    })
    setInterval(() => exitIfPolluted({ baseline, source: 'interval' }), CHECK_INTERVAL_MS).unref()
}

function findAddedKeys({ baseline }: { baseline: Set<string> }): string[] {
    return Object.keys(Object.prototype).filter((key) => !baseline.has(key))
}

function exitIfPolluted({ baseline, source }: { baseline: Set<string>, source: string }): void {
    const addedKeys = findAddedKeys({ baseline })
    if (addedKeys.length === 0) {
        return
    }
    const described = addedKeys.map((key) => `${key}:${typeof Reflect.get(Object.prototype, key)}`).join(',')
    process.stderr.write(`[prototypePollutionGuard] Object.prototype gained enumerable keys, exiting so the container restarts. keys=${described} source=${source}\n`)
    process.exit(1)
}

export const prototypePollutionGuard = { register }
