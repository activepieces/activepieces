import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { ActivepiecesError, ErrorCode } from "@activepieces/shared";

export const errorHandler = async (
    error: FastifyError,
    _request: FastifyRequest,
    reply: FastifyReply
): Promise<void> => {
    console.error("[errorHandler]:", error);

    if (error instanceof ActivepiecesError) {
        let statusCode = StatusCodes.BAD_REQUEST;
        switch (error.error.code) {
        case ErrorCode.TASK_QUOTA_EXCEEDED:
            statusCode = StatusCodes.PAYMENT_REQUIRED;
            break;
        case ErrorCode.INVALID_BEARER_TOKEN:
            statusCode = StatusCodes.UNAUTHORIZED;
            break;
        }
        await reply.status(statusCode).send({
            code: error.error.code,
            params:error.error.params
        });
    }
    else {
        await reply.status(error.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR).send(error);
    }
};
