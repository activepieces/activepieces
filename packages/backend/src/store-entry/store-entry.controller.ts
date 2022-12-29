import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { storeEntryService } from "./store-entry.service";
import { PrincipalType, PutStoreEntryRequest } from "shared";
import { StatusCodes } from "http-status-codes";

export const storeEntryController = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {
  fastify.post(
    "/",
    {
      schema: {
        body: PutStoreEntryRequest,
      },
    },
    async (
      _request: FastifyRequest<{
        Body: PutStoreEntryRequest;
      }>,
      _reply
    ) => {
      if (_request.principal.type !== PrincipalType.WORKER) {
        _reply.status(StatusCodes.FORBIDDEN).send();
      } else {
        return await storeEntryService.upsert(_request.principal.collectionId, _request.body);
      }
    }
  );

  fastify.get(
    "/",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            key: { type: "string" },
          },
          required: ["key"],
        },
      },
    },
    async (
      _request: FastifyRequest<{
        Body: PutStoreEntryRequest;
        Querystring: {
          key: string;
        };
      }>,
      _reply
    ) => {
      if (_request.principal.type !== PrincipalType.WORKER) {
        _reply.status(StatusCodes.FORBIDDEN).send();
      } else {
        return await storeEntryService.getOne(_request.principal.collectionId, _request.query.key);
      }
    }
  );
};
