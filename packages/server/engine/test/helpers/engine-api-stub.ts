import { createServer, IncomingMessage, ServerResponse } from 'node:http'
import { AddressInfo } from 'node:net'

export async function startEngineApiStub(routes: Routes = {}): Promise<EngineApiStub> {
    const requests: RecordedRequest[] = []

    const server = createServer((req, res) => void handle({ req, res, routes, requests }))
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const { port } = server.address() as AddressInfo

    return {
        url: `http://127.0.0.1:${port}/`,
        requests,
        requestsFor: (path: string) => requests.filter((request) => request.path === path),
        close: async () => new Promise<void>((resolve) => server.close(() => resolve())),
    }
}

async function handle({ req, res, routes, requests }: HandleParams): Promise<void> {
    const path = (req.url ?? '').split('?')[0]
    const body = await readBody(req)
    requests.push({ method: req.method ?? 'GET', path, body })

    const route = routes[`${req.method} ${path}`] ?? routes[path]
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(route ?? {}))
}

async function readBody(req: IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = []
    for await (const chunk of req) {
        chunks.push(Buffer.from(chunk))
    }
    if (chunks.length === 0) {
        return undefined
    }
    try {
        return JSON.parse(Buffer.concat(chunks).toString())
    }
    catch {
        return Buffer.concat(chunks).toString()
    }
}

type Routes = Record<string, unknown>

type HandleParams = {
    req: IncomingMessage
    res: ServerResponse
    routes: Routes
    requests: RecordedRequest[]
}

export type RecordedRequest = {
    method: string
    path: string
    body: unknown
}

export type EngineApiStub = {
    url: string
    requests: RecordedRequest[]
    requestsFor: (path: string) => RecordedRequest[]
    close: () => Promise<void>
}
