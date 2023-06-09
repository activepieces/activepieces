import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'
import { captureException } from './logger'
import { logger } from '@sentry/utils'

export const errorHandler = async (
    error: FastifyError,
    _request: FastifyRequest,
    reply: FastifyReply,
): Promise<void> => {
    logger.error('[errorHandler]:', error)
    if (error instanceof ActivepiecesError) {
        const statusCodeMap: Partial<Record<ErrorCode, StatusCodes>> = {
            [ErrorCode.INVALID_API_KEY]: StatusCodes.UNAUTHORIZED,
            [ErrorCode.INVALID_BEARER_TOKEN]: StatusCodes.UNAUTHORIZED,
            [ErrorCode.TASK_QUOTA_EXCEEDED]: StatusCodes.PAYMENT_REQUIRED,
            [ErrorCode.ENTITY_NOT_FOUND]: StatusCodes.NOT_FOUND,
        }

        const statusCode = statusCodeMap[error.error.code] ?? StatusCodes.BAD_REQUEST

        await reply.status(statusCode).send({
            code: error.error.code,
            params:error.error.params,
        })
    }
    else {
        if(!error.statusCode || error.statusCode === StatusCodes.INTERNAL_SERVER_ERROR){
            captureException(error)
        }
        await reply.status(error.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR).send(error)
    }
}
