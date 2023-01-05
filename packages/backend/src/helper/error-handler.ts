import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { StatusCodes } from "http-status-codes";
import { ActivepiecesError } from "./activepieces-error";

export const errorHandler = async (
  error: FastifyError,
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (error instanceof ActivepiecesError) {
    await reply.status(StatusCodes.BAD_REQUEST).send({
      code: error.error.code,
    });
  } else {
    await reply.status(error.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR).send(error);
  }
};
