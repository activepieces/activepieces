import { AIProvider } from '@activepieces/common-ai'
import { FastifyRequest, RawServerBase, RequestGenericInterface } from 'fastify'

export type Usage = {
    cost: number
    model: string
}

export type AIProviderStrategy = {
    extractModelId: (request: FastifyRequest<RequestGenericInterface, RawServerBase>) => string | null
    calculateUsage: (request: FastifyRequest<RequestGenericInterface, RawServerBase>, response: Record<string, unknown>) => Usage
    isStreaming: (request: FastifyRequest<RequestGenericInterface, RawServerBase>) => boolean
    getAuthHeaders?: (config: AIProvider['config']) => Record<string, string>
    getBaseUrl?: (config: AIProvider['config']) => string
    rewriteUrl?: (config: AIProvider['config'], originalUrl: string) => string
    streamingParser?: () => StreamingParser
    isModerationRequest?: (request: FastifyRequest<RequestGenericInterface, RawServerBase>) => boolean
}

export type StreamingParser = {
    onChunk: (chunk: string) => void
    onEnd: () => Record<string, unknown>
}
