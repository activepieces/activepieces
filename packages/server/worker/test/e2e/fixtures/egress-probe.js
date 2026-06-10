/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
// Minimal probe that runs inside an isolate sandbox.
// Reads AP_PROBE_PLAN from env (JSON array of actions) and writes a JSON summary to stdout.
// Most actions use only Node core modules; the `fetch-via-undici` action additionally
// requires undici from a mounted location (set via AP_UNDICI_REQUIRE_PATH) to exercise
// the *exact* production code path that real user code-pieces hit:
// globalThis.fetch -> undici global dispatcher -> ProxyAgent -> CONNECT to egress proxy.

const dns = require('node:dns')
const http = require('node:http')
const https = require('node:https')
const net = require('node:net')
const tls = require('node:tls')
const { URL } = require('node:url')

async function main() {
    let plan
    try {
        plan = JSON.parse(process.env.AP_PROBE_PLAN || '[]')
    }
    catch (err) {
        process.stdout.write(JSON.stringify({ error: 'bad plan', detail: String(err) }))
        return
    }
    const results = []
    for (const action of plan) {
        try {
            if (action.type === 'http-get-via-proxy') {
                results.push(await httpGetViaProxy(action))
            }
            else if (action.type === 'direct-tcp-connect') {
                results.push(await directTcpConnect(action))
            }
            else if (action.type === 'direct-http') {
                results.push(await directHttpGet(action))
            }
            else if (action.type === 'dns-lookup') {
                results.push(await dnsLookup(action))
            }
            else if (action.type === 'dns-lookup-v6') {
                results.push(await dnsLookupV6(action))
            }
            else if (action.type === 'https-head-via-proxy') {
                results.push(await httpsHeadViaProxy(action))
            }
            else if (action.type === 'fetch-via-undici') {
                results.push(await fetchViaUndici(action))
            }
            else {
                results.push({ action, error: 'unknown action type' })
            }
        }
        catch (err) {
            results.push({ action, error: String(err && err.message || err) })
        }
    }
    process.stdout.write(JSON.stringify({ results }))
}

function httpGetViaProxy(action) {
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
                action,
                statusCode: res.statusCode,
                body: Buffer.concat(chunks).toString().slice(0, 200),
            }))
        })
        req.on('error', (err) => resolve({ action, error: err.code || err.message }))
        req.setTimeout(5000, () => {
            req.destroy(new Error('timeout')) 
        })
        req.end()
    })
}

function directHttpGet(action) {
    return new Promise((resolve) => {
        const req = http.request({
            host: action.host,
            port: action.port,
            method: 'GET',
            path: action.path || '/',
        }, (res) => {
            const chunks = []
            res.on('data', (c) => chunks.push(c))
            res.on('end', () => resolve({ action, statusCode: res.statusCode }))
        })
        req.on('error', (err) => resolve({ action, error: err.code || err.message }))
        req.setTimeout(5000, () => {
            req.destroy(new Error('timeout')) 
        })
        req.end()
    })
}

function directTcpConnect(action) {
    return new Promise((resolve) => {
        const socket = net.createConnection({ host: action.host, port: action.port })
        socket.setTimeout(5000)
        socket.on('connect', () => {
            socket.destroy(); resolve({ action, status: 'OK' }) 
        })
        socket.on('timeout', () => {
            socket.destroy(); resolve({ action, status: 'TIMEOUT' }) 
        })
        socket.on('error', (err) => resolve({ action, status: 'ERR', code: err.code || err.message }))
    })
}

function dnsLookup(action) {
    return new Promise((resolve) => {
        const start = Date.now()
        dns.lookup(action.hostname, { family: 4 }, (err, address) => {
            const elapsedMs = Date.now() - start
            if (err) {
                resolve({ action, status: 'ERR', code: err.code, syscall: err.syscall, errno: err.errno, elapsedMs, message: err.message })
                return
            }
            resolve({ action, status: 'OK', address, elapsedMs })
        })
    })
}

function dnsLookupV6(action) {
    return new Promise((resolve) => {
        const start = Date.now()
        dns.lookup(action.hostname, { family: 6 }, (err, address) => {
            const elapsedMs = Date.now() - start
            if (err) {
                resolve({ action, status: 'ERR', code: err.code, syscall: err.syscall, errno: err.errno, elapsedMs, message: err.message })
                return
            }
            resolve({ action, status: 'OK', address, elapsedMs })
        })
    })
}

function httpsHeadViaProxy(action) {
    return new Promise((resolve) => {
        const start = Date.now()
        const proxyUrl = new URL(process.env.AP_EGRESS_PROXY_URL || '')
        const target = new URL(action.url)
        const targetHost = target.hostname
        const targetPort = target.port ? parseInt(target.port, 10) : 443
        const settle = (payload) => resolve({ ...payload, action, elapsedMs: Date.now() - start })
        const connectReq = http.request({
            host: proxyUrl.hostname,
            port: parseInt(proxyUrl.port, 10),
            method: 'CONNECT',
            path: `${targetHost}:${targetPort}`,
            headers: { host: `${targetHost}:${targetPort}` },
        })
        connectReq.setTimeout(action.timeoutMs || 10000, () => {
            connectReq.destroy(new Error('connect-timeout'))
            settle({ status: 'ERR', code: 'CONNECT_TIMEOUT' })
        })
        connectReq.on('error', (err) => settle({ status: 'ERR', code: err.code || 'ERR', message: err.message }))
        connectReq.on('connect', (res, socket) => {
            if (res.statusCode !== 200) {
                socket.destroy()
                settle({ status: 'ERR', code: 'PROXY_REJECT', proxyStatus: res.statusCode })
                return
            }
            const tlsSocket = tls.connect({
                socket,
                servername: targetHost,
                ALPNProtocols: ['http/1.1'],
            })
            tlsSocket.setTimeout(action.timeoutMs || 10000, () => {
                tlsSocket.destroy(new Error('tls-timeout'))
                settle({ status: 'ERR', code: 'TLS_TIMEOUT' })
            })
            tlsSocket.on('error', (err) => settle({ status: 'ERR', code: err.code || 'TLS_ERR', message: err.message }))
            tlsSocket.on('secureConnect', () => {
                const httpReq = https.request({
                    createConnection: () => tlsSocket,
                    method: 'HEAD',
                    host: targetHost,
                    port: targetPort,
                    path: target.pathname || '/',
                    headers: { host: targetHost, 'user-agent': 'activepieces-sandbox-smoke/1.0' },
                }, (httpRes) => {
                    httpRes.resume()
                    httpRes.on('end', () => {
                        tlsSocket.destroy()
                        settle({ status: 'OK', statusCode: httpRes.statusCode })
                    })
                })
                httpReq.on('error', (err) => settle({ status: 'ERR', code: err.code || 'HTTP_ERR', message: err.message }))
                httpReq.end()
            })
        })
        connectReq.end()
    })
}

// fetch-via-undici reproduces the exact data path a real user code-piece traverses
// under STRICT mode: globalThis.fetch reads the undici global dispatcher (a ProxyAgent
// installed by ssrf-guard's installEnvProxyDispatcher in engine main.ts), opens a
// keep-alive client to the egress proxy, sends CONNECT for HTTPS targets, then sends
// the request over the tunneled TLS socket. The existing https-head-via-proxy action
// bypasses undici and the global dispatcher entirely, so it cannot detect bugs in:
//  - ProxyAgent install / setGlobalDispatcher / Symbol-keyed state sharing with Node's
//    built-in fetch
//  - undici's CONNECT handling, connection pooling, redirect re-CONNECT, TLS negotiation
//  - the AP_EGRESS_PROXY_URL env propagation chain (engine reads it; missing → fetch
//    falls back to direct connect → iptables REJECT → EHOSTUNREACH "fetch failed")
// AP_UNDICI_REQUIRE_PATH must point at a directory the sandbox can require the undici
// package from (e.g. an additional mount the test sets up).
async function fetchViaUndici(action) {
    const started = Date.now()
    const settle = (payload) => ({ ...payload, action, elapsedMs: Date.now() - started })
    try {
        const undiciPath = process.env.AP_UNDICI_REQUIRE_PATH
        if (!undiciPath) return settle({ status: 'ERR', code: 'AP_UNDICI_REQUIRE_PATH_MISSING' })
        const undici = require(undiciPath)
        const proxyUrl = process.env.AP_EGRESS_PROXY_URL
        if (proxyUrl) undici.setGlobalDispatcher(new undici.ProxyAgent(proxyUrl))
        const res = await fetch(action.url, {
            method: action.method || 'HEAD',
            signal: AbortSignal.timeout(action.timeoutMs || 8000),
        })
        return settle({ status: 'OK', statusCode: res.status })
    }
    catch (err) {
        const cause = err && err.cause
        return settle({
            status: 'ERR',
            code: (err && err.code) || (cause && cause.code) || 'FETCH_ERR',
            message: (err && err.message) || 'fetch failed',
            causeMessage: cause && cause.message,
        })
    }
}

main().catch((err) => {
    process.stdout.write(JSON.stringify({ fatal: String(err && err.message || err) }))
    process.exit(1)
})
