import { logger } from './logger'

export const rejectedPromiseHandler = (promise: Promise<unknown>): void => {
    promise.catch((error) => {
        logger.error(error)
    })
}
