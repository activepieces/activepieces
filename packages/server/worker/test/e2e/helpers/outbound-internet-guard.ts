import net from 'node:net'
import { SkipReason } from './privilege-guard'

export async function requireOutboundInternet(): Promise<SkipReason | undefined> {
    const reachable = await canConnect({ host: '1.1.1.1', port: 443, timeoutMs: 3_000 })
    if (!reachable) {
        return { skip: true, reason: 'requires outbound internet (TCP/443 to 1.1.1.1) — skipping real third-party connectivity suite' }
    }
    return undefined
}

function canConnect({ host, port, timeoutMs }: { host: string, port: number, timeoutMs: number }): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = net.createConnection({ host, port })
        const finish = (ok: boolean): void => {
            socket.removeAllListeners()
            socket.destroy()
            resolve(ok)
        }
        socket.setTimeout(timeoutMs)
        socket.once('connect', () => finish(true))
        socket.once('timeout', () => finish(false))
        socket.once('error', () => finish(false))
    })
}
