import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { StatusCodes } from 'http-status-codes'
import { exceptionHandler, logger } from '@activepieces/server-shared'
import { ActivepiecesError, ErrorCode } from '@activepieces/shared'


export const errorHandler = async (
    error: FastifyError,
    _request: FastifyRequest,
    reply: FastifyReply,
): Promise<void> => {
    if (error instanceof ActivepiecesError) {
        const statusCodeMap: Partial<Record<ErrorCode, StatusCodes>> = {
            [ErrorCode.INVALID_API_KEY]: StatusCodes.UNAUTHORIZED,
            [ErrorCode.INVALID_BEARER_TOKEN]: StatusCodes.UNAUTHORIZED,
            [ErrorCode.QUOTA_EXCEEDED]: StatusCodes.PAYMENT_REQUIRED,
            [ErrorCode.FEATURE_DISABLED]: StatusCodes.PAYMENT_REQUIRED,
            [ErrorCode.PERMISSION_DENIED]: StatusCodes.FORBIDDEN,
            [ErrorCode.ENTITY_NOT_FOUND]: StatusCodes.NOT_FOUND,
            [ErrorCode.EXISTING_USER]: StatusCodes.CONFLICT,
            [ErrorCode.EXISTING_ALERT_CHANNEL]: StatusCodes.CONFLICT,
            [ErrorCode.FLOW_IN_USE]: StatusCodes.CONFLICT,
            [ErrorCode.AUTHORIZATION]: StatusCodes.FORBIDDEN,
            [ErrorCode.SIGN_UP_DISABLED]: StatusCodes.FORBIDDEN,
            [ErrorCode.INVALID_CREDENTIALS]: StatusCodes.UNAUTHORIZED,
            [ErrorCode.EMAIL_IS_NOT_VERIFIED]: StatusCodes.FORBIDDEN,
            [ErrorCode.USER_IS_INACTIVE]: StatusCodes.FORBIDDEN,
            [ErrorCode.DOMAIN_NOT_ALLOWED]: StatusCodes.FORBIDDEN,
            [ErrorCode.EMAIL_AUTH_DISABLED]: StatusCodes.FORBIDDEN,
            [ErrorCode.INVALID_OTP]: StatusCodes.GONE,
            [ErrorCode.VALIDATION]: StatusCodes.CONFLICT,
            [ErrorCode.INVITATION_ONLY_SIGN_UP]: StatusCodes.FORBIDDEN,
            [ErrorCode.AUTHENTICATION]: StatusCodes.UNAUTHORIZED,
        }

        const statusCode =
      statusCodeMap[error.error.code] ?? StatusCodes.BAD_REQUEST

        await reply.status(statusCode).send({
            code: error.error.code,
            params: error.error.params,
        })
    }
    else {
        logger.error('[errorHandler]: ' + JSON.stringify(error))
        if (
            !error.statusCode ||
      error.statusCode === StatusCodes.INTERNAL_SERVER_ERROR.valueOf()
        ) {
            exceptionHandler.handle(error)
        }
        await reply
            .status(error.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR)
            .send(error)
    }
}
