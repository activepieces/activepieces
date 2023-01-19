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
    const statusCode =
      error.error.code === ErrorCode.INVALID_BEARER_TOKEN ? StatusCodes.UNAUTHORIZED : StatusCodes.BAD_REQUEST;

    await reply.status(statusCode).send({
      code: error.error.code,
    });
  } else {
    await reply.status(error.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
};
