import { DrainContext } from 'evlog'
import { createAxiomDrain } from 'evlog/axiom'
import { createBetterStackDrain } from 'evlog/better-stack'
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

function resolve({ config }: { config: EvlogDrainConfig }): ResolvedDrain {
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
