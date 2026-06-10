import http from 'node:http'
import { AddressInfo, createServer, Server, Socket } from 'node:net'

export async function startHttpEcho(): Promise<EchoServer> {
    const server = http.createServer((req, res) => {
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'x-echo-method': req.method ?? '',
            'x-echo-url': req.url ?? '',
        })
        res.end('echo-body')
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    const port = (server.address() as AddressInfo).port
    return {
        port,
        close: () => new Promise<void>((resolve) => server.close(() => resolve())),
    }
}

export async function startTcpEcho(): Promise<EchoServer> {
    const server: Server = createServer((socket: Socket) => {
        socket.on('data', (chunk) => socket.write(chunk))
        socket.on('error', () => socket.destroy())
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()))
    const port = (server.address() as AddressInfo).port
    return {
        port,
        close: () => new Promise<void>((resolve) => server.close(() => resolve())),
    }
}

export type EchoServer = {
    port: number
    close: () => Promise<void>
}
