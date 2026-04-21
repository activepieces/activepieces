/* eslint-disable @typescript-eslint/no-require-imports */
// Probe that loads the bundled engine ssrf-guard (installs DNS/Socket/undici hooks
// at require-time) and then runs each AP_PROBE_PLAN case against the hooked stack.
// Uses node core only for egress; HTTP calls are plain http.request (the proxy env
// is set via process.env.AP_EGRESS_PROXY_URL).

const dns = require('node:dns')
const http = require('node:http')
const net = require('node:net')
const { URL } = require('node:url')

const ssrfGuardModule = require('./ssrf-guard-bundle.js')
const GUARD_ENABLED = ssrfGuardModule.ssrfGuard && ssrfGuardModule.ssrfGuard.isEnabled()

async function main() {
    let plan
    try {
        plan = JSON.parse(process.env.AP_PROBE_PLAN || '[]')
    }
    catch (err) {
        process.stdout.write(JSON.stringify({ fatal: 'bad plan', detail: String(err) }))
        return
    }
    const results = []
    for (const action of plan) {
        try {
            results.push(await runCase(action))
        }
        catch (err) {
            results.push({ case: action.case, ok: false, error: String(err && err.message || err) })
        }
    }
    process.stdout.write(JSON.stringify({ results, guardEnabled: GUARD_ENABLED }))
}

async function runCase(action) {
    switch (action.type) {
        case 'connect-expect-ok':
            return await tcpConnect(action, { expectBlocked: false })
        case 'connect-expect-blocked':
            return await tcpConnect(action, { expectBlocked: true })
        case 'dns-expect-blocked':
            return await dnsLookupExpectBlocked(action)
        case 'http-via-proxy':
            return await httpViaProxy(action)
        default:
            return { case: action.case, ok: false, error: `unknown action type ${action.type}` }
    }
}

function tcpConnect(action, { expectBlocked }) {
    return new Promise((resolve) => {
        const socket = new net.Socket()
        let settled = false
        const settle = (result) => {
            if (settled) return
            settled = true
            socket.destroy()
            resolve(result)
        }
        socket.setTimeout(3000)
        socket.on('connect', () => {
            settle({ case: action.case, ok: !expectBlocked, outcome: 'connected' })
        })
        socket.on('error', (err) => {
            const isSsrf = err && err.name === 'SSRFBlockedError'
            settle({
                case: action.case,
                ok: expectBlocked ? isSsrf : (!isSsrf),
                outcome: isSsrf ? 'ssrf-blocked' : `err:${err && err.code || err && err.message}`,
            })
        })
        socket.on('timeout', () => {
            settle({ case: action.case, ok: !expectBlocked, outcome: 'timeout' })
        })
        socket.connect({ host: action.host, port: action.port })
    })
}

function dnsLookupExpectBlocked(action) {
    return new Promise((resolve) => {
        dns.promises.lookup(action.hostname).then(() => {
            resolve({ case: action.case, ok: false, outcome: 'resolved' })
        }).catch((err) => {
            const isSsrf = err && err.name === 'SSRFBlockedError'
            resolve({
                case: action.case,
                ok: isSsrf,
                outcome: isSsrf ? 'ssrf-blocked' : `err:${err && err.code || err && err.message}`,
            })
        })
    })
}

function httpViaProxy(action) {
    return new Promise((resolve) => {
        const proxyUrl = new URL(process.env.AP_EGRESS_PROXY_URL || '')
        const req = http.request({
            host: proxyUrl.hostname,
            port: parseInt(proxyUrl.port, 10),
            method: 'GET',
            path: action.url,
            headers: { host: new URL(action.url).host },
        }, (res) => {
            const chunks = []
            res.on('data', (c) => chunks.push(c))
            res.on('end', () => resolve({
                case: action.case,
                ok: res.statusCode === action.expectStatus,
                outcome: `status:${res.statusCode}`,
                body: Buffer.concat(chunks).toString().slice(0, 200),
            }))
        })
        req.on('error', (err) => {
            const isSsrf = err && err.name === 'SSRFBlockedError'
            resolve({
                case: action.case,
                ok: false,
                outcome: isSsrf ? 'ssrf-blocked' : `err:${err && err.code || err && err.message}`,
            })
        })
        req.setTimeout(5000, () => { req.destroy(new Error('timeout')) })
        req.end()
    })
}

main().catch((err) => {
    process.stdout.write(JSON.stringify({ fatal: String(err && err.message || err) }))
    process.exit(1)
})
