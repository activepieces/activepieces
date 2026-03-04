/**
 * Engine process that connects but never responds to operations.
 * Used to test sandbox execution timeout.
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

socket.on('engine-operation', () => {
    // Intentionally do nothing — simulate a hang
})
