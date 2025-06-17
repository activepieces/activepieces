import { FastifyRequest, RawServerBase, RequestGenericInterface } from 'fastify'

export type Usage = {
    cost: number
    model: string
}

export type AIProviderParser = {
    extractModelId: (request: FastifyRequest<RequestGenericInterface, RawServerBase>) => string | null
    usageStrategy: (request: FastifyRequest<RequestGenericInterface, RawServerBase>, response: Record<string, unknown>) => Usage
} 