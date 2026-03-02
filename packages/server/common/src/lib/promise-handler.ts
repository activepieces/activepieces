import { FastifyBaseLogger } from 'fastify'

export function rejectedPromiseHandler(promise: Promise<unknown>, log: FastifyBaseLogger) {
    promise.catch((error) => {
        log.error(error)
    })
}
