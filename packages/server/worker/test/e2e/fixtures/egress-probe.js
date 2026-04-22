/* eslint-disable @typescript-eslint/no-require-imports */
// Minimal probe that runs inside an isolate sandbox.
// Reads AP_PROBE_PLAN from env (JSON array of actions) and writes a JSON summary to stdout.
// Uses only Node core modules so it does not need any mounted node_modules.

const http = require('node:http')
const net = require('node:net')
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
        req.setTimeout(5000, () => { req.destroy(new Error('timeout')) })
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
        req.setTimeout(5000, () => { req.destroy(new Error('timeout')) })
        req.end()
    })
}

function directTcpConnect(action) {
    return new Promise((resolve) => {
        const socket = net.createConnection({ host: action.host, port: action.port })
        socket.setTimeout(5000)
        socket.on('connect', () => { socket.destroy(); resolve({ action, status: 'OK' }) })
        socket.on('timeout', () => { socket.destroy(); resolve({ action, status: 'TIMEOUT' }) })
        socket.on('error', (err) => resolve({ action, status: 'ERR', code: err.code || err.message }))
    })
}

main().catch((err) => {
    process.stdout.write(JSON.stringify({ fatal: String(err && err.message || err) }))
    process.exit(1)
})
