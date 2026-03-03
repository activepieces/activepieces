/**
 * Engine process that connects via websocket then allocates memory until killed.
 * Used to test sandbox memory limit enforcement via cgroups.
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
    // Allocate memory in a loop until the process is killed by cgroup OOM
    const buffers = []
    const chunkSize = 10 * 1024 * 1024 // 10 MB
    const allocate = () => {
        buffers.push(Buffer.alloc(chunkSize))
        setTimeout(allocate, 10)
    }
    allocate()
})
