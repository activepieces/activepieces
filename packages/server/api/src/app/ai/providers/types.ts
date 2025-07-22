import { FastifyRequest, RawServerBase, RequestGenericInterface } from 'fastify'

export type Usage = {
    cost: number
    model: string
}

export type AIProviderStrategy = {
    extractModelId: (request: FastifyRequest<RequestGenericInterface, RawServerBase>) => string | null
    calculateUsage: (request: FastifyRequest<RequestGenericInterface, RawServerBase>, response: Record<string, unknown>) => Usage
    isStreaming: (request: FastifyRequest<RequestGenericInterface, RawServerBase>) => boolean
    streamingParser?: () => StreamingParser
}

export type StreamingParser = {
    onChunk: (chunk: string) => void
    onEnd: () => Record<string, unknown>
}
