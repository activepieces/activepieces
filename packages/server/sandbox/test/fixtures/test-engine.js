/**
 * Minimal engine process for integration tests.
 * Connects to the worker websocket server, receives operations, and responds.
 */
const { io } = require('socket.io-client')

const sandboxId = process.env.SANDBOX_ID
const port = process.env.WS_PORT || '12345'

if (!sandboxId) {
    process.exit(1)
}

const socket = io(`ws://127.0.0.1:${port}`, {
    path: '/worker/ws',
    auth: { sandboxId },
    autoConnect: true,
    reconnection: false,
})

socket.on('engine-operation', (data) => {
    const { operation, operationType } = data

    // Echo the operation back as a successful response
    socket.emit('command', {
        event: 'engine-response',
        payload: {
            status: 'OK',
            response: { echo: true, operationType },
        },
    })
})
