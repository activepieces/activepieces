import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { DrainContext } from 'evlog'
import { createAxiomDrain } from 'evlog/axiom'
import { createBetterStackDrain } from 'evlog/better-stack'
import { createFsDrain } from 'evlog/fs'
import { createHyperDXDrain } from 'evlog/hyperdx'
import { createOTLPDrain } from 'evlog/otlp'
import { createDrainPipeline, PipelineDrainFn } from 'evlog/pipeline'
import { AxiosInstance } from 'axios'
import { safeHttp } from './safe-http'

function normalizeBetterstackEndpoint(host: string): string {
    if (host.startsWith('https://') || host.startsWith('http://')) {
        return host
    }
    return `https://${host}`
}

function createLokiDrain({ url, username, password, serviceName, httpClient }: CreateLokiDrainParams): (batch: DrainContext[]) => Promise<void> {
    const client: AxiosInstance = httpClient ?? buildLokiClient({ url, username, password })

    return async function sendToLoki(batch: DrainContext[]): Promise<void> {
        if (batch.length === 0) return

        const streamMap: Record<string, Array<[string, string]>> = {}

        for (const ctx of batch) {
            const event = ctx.event
            const level = event.level ?? 'info'
            const key = `${level}`
            if (!streamMap[key]) {
                streamMap[key] = []
            }
            const ts = event.timestamp ?? new Date().toISOString()
            const nanos = String(BigInt(Date.parse(ts)) * 1000000n)
            streamMap[key].push([nanos, JSON.stringify(event)])
        }

        const streams = Object.entries(streamMap).map(([level, values]) => ({
            stream: { service: serviceName, level },
            values,
        }))

        try {
            await client.post(`${url}/loki/api/v1/push`, { streams })
        }
        catch (err) {
            console.error('[evlog-loki] failed to push batch:', err instanceof Error ? err.message : String(err))
        }
    }
}

function buildLokiClient({ url: _url, username, password }: BuildLokiClientParams): AxiosInstance {
    if (username && password) {
        const encoded = Buffer.from(`${username}:${password}`).toString('base64')
        return safeHttp.createAxios({
            headers: { Authorization: `Basic ${encoded}` },
        })
    }
    return safeHttp.createAxios()
}

function resolveRemote({ config }: { config: EvlogDrainConfig }): ResolvedDrain {
    if (config.axiomToken && config.axiomDataset) {
        const adapter = createAxiomDrain({ apiKey: config.axiomToken, dataset: config.axiomDataset })
        const pipeline = buildPipeline((batch) => adapter(batch))
        return { drain: pipeline, flush: () => pipeline.flush() }
    }

    if (config.hyperdxToken) {
        const adapter = createHyperDXDrain({ apiKey: config.hyperdxToken, serviceName: config.serviceName })
        const pipeline = buildPipeline((batch) => adapter(batch))
        return { drain: pipeline, flush: () => pipeline.flush() }
    }

    if (config.lokiUrl) {
        const lokiDrain = createLokiDrain({
            url: config.lokiUrl,
            username: config.lokiUsername,
            password: config.lokiPassword,
            serviceName: config.serviceName,
        })
        const pipeline = buildPipeline(lokiDrain)
        return { drain: pipeline, flush: () => pipeline.flush() }
    }

    if (config.betterstackToken && config.betterstackHost) {
        const endpoint = normalizeBetterstackEndpoint(config.betterstackHost)
        const adapter = createBetterStackDrain({ apiKey: config.betterstackToken, endpoint })
        const pipeline = buildPipeline((batch) => adapter(batch))
        return { drain: pipeline, flush: () => pipeline.flush() }
    }

    if (config.otlpEnabled) {
        const adapter = createOTLPDrain({ serviceName: config.serviceName })
        const pipeline = buildPipeline((batch) => adapter(batch))
        return { drain: pipeline, flush: () => pipeline.flush() }
    }

    return { drain: undefined, flush: async () => undefined }
}

// Walks up from cwd to the monorepo root (anchored on turbo.json) so the api
// and worker processes — which may run from different cwds — converge on one
// shared `.evlog/logs` directory. Dev-only; falls back to cwd if not found.
function resolveRepoLogDir(): string {
    let dir = process.cwd()
    let root = process.cwd()
    for (let i = 0; i < 12; i++) {
        if (existsSync(join(dir, 'turbo.json'))) {
            root = dir
            break
        }
        const parent = dirname(dir)
        if (parent === dir) {
            break
        }
        dir = parent
    }
    return join(root, '.evlog', 'logs')
}

function resolve({ config }: { config: EvlogDrainConfig }): ResolvedDrain {
    const remote = resolveRemote({ config })
    if (!config.fileEnabled) {
        return remote
    }

    // NDJSON (pretty:false) is required by the analyze-logs skill / jq tooling.
    const fsDrain = createFsDrain({ dir: config.fileDir ?? resolveRepoLogDir(), pretty: false, maxFiles: 14 })
    const drain = async (ctx: DrainContext): Promise<void> => {
        if (remote.drain) {
            await remote.drain(ctx)
        }
        await fsDrain(ctx)
    }
    return { drain, flush: remote.flush }
}

function buildPipeline(
    batchFn: (batch: DrainContext[]) => Promise<void>,
): PipelineDrainFn<DrainContext> {
    const factory = createDrainPipeline<DrainContext>({
        batch: { size: 100, intervalMs: 5000 },
        maxBufferSize: 5000,
        retry: { maxAttempts: 3 },
        onDropped: (events: DrainContext[], err?: Error) => {
            console.error(`[evlog-pipeline] dropped ${events.length} events`, err?.message ?? '')
        },
    })
    return factory(batchFn)
}

export const evlogDrains = {
    resolve,
    createLokiDrain,
}

export type EvlogDrainConfig = {
    serviceName: string
    hyperdxToken?: string
    axiomToken?: string
    axiomDataset?: string
    lokiUrl?: string
    lokiUsername?: string
    lokiPassword?: string
    betterstackToken?: string
    betterstackHost?: string
    otlpEnabled?: boolean
    fileEnabled?: boolean
    fileDir?: string
}

type ResolvedDrain = {
    drain: ((ctx: DrainContext) => void | Promise<void>) | undefined
    flush: () => Promise<void>
}

type CreateLokiDrainParams = {
    url: string
    username?: string
    password?: string
    serviceName: string
    httpClient?: AxiosInstance
}

type BuildLokiClientParams = {
    url: string
    username?: string
    password?: string
}
