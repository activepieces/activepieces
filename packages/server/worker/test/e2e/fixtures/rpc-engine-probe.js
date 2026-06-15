/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
// Minimal "engine" that mirrors packages/server/engine/src/lib/worker-socket.ts:
// it connects back to the worker's socket.io WS-RPC server over the gateway veth IP
// (ap-egress has no other route), authenticates with the rotated handshake token, and
// answers exactly one `executeOperation` RPC by echoing a marker. This proves the real
// engine<->worker control channel works topologically through the /30 veth link.
//
// socket.io-client is mirrored into the mounted common dir (AP_SOCKETIO_REQUIRE_PATH)
// because this standalone fixture is not the bundled engine and has no node_modules of
// its own. The shared RPC wire-format (event name 'rpc', { method, payload } + ack) is
// inlined here to avoid bundling @activepieces/shared into a fixture.

const http = require('node:http')

const RPC_EVENT = 'rpc'

function fail(message) {
    process.stdout.write(JSON.stringify({ status: 'ERR', message: String(message) }) + '\n')
    process.exit(1)
}

function main() {
    const requirePath = process.env.AP_SOCKETIO_REQUIRE_PATH
    if (!requirePath) return fail('AP_SOCKETIO_REQUIRE_PATH missing')
    const { io } = require(requirePath)

    const wsHost = process.env.AP_SANDBOX_WS_HOST || '127.0.0.1'
    const wsPort = process.env.AP_SANDBOX_WS_PORT
    const sandboxId = process.env.SANDBOX_ID || 'rpc-probe'
    const wsUrl = `ws://${wsHost}:${wsPort}`

    const socket = io(wsUrl, {
        path: '/worker/ws',
        auth: { sandboxId, connectionToken: process.env.AP_SANDBOX_WS_TOKEN },
        reconnection: false,
        // A plain http.Agent keeps the worker RPC handshake off any installed proxy agent,
        // exactly as the real engine does in STRICT mode.
        agent: new http.Agent(),
    })

    const watchdog = setTimeout(() => fail('engine did not connect within 25s'), 25_000)

    socket.on('connect_error', (err) => fail(`connect_error: ${err && err.message}`))

    socket.on('connect', () => {
        clearTimeout(watchdog)
        // Answer one executeOperation by echoing back the marker from the operation payload.
        socket.on(RPC_EVENT, (msg, ack) => {
            try {
                if (msg && msg.method === 'executeOperation') {
                    const marker = msg.payload && msg.payload.operation && msg.payload.operation.marker
                    ack({ status: 'OK', response: { echoedMarker: marker } })
                    return
                }
                ack({ __rpcError: `unknown method ${msg && msg.method}` })
            }
            catch (err) {
                ack({ __rpcError: String(err && err.message || err) })
            }
        })
        process.stdout.write(JSON.stringify({ status: 'CONNECTED', wsUrl }) + '\n')
    })
}

main()
