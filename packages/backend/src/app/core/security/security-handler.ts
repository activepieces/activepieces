import { FastifyRequest } from 'fastify'

export type SecurityHandler = {
    handle(request: FastifyRequest): Promise<void>
}

export abstract class BaseSecurityHandler implements SecurityHandler {
    async handle(request: FastifyRequest): Promise<void> {
        if (await this.canHandle(request)) {
            await this.doHandle(request)
        }
    }

    protected abstract canHandle(request: FastifyRequest): Promise<boolean>
    protected abstract doHandle(request: FastifyRequest): Promise<void>
}
