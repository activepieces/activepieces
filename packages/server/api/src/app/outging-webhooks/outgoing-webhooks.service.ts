import {
  CreateOutgoingWebhookRequestBody,
  OutgoingWebhook,
  UpdateOutgoingWebhookRequestBody,
} from '@activepieces/ee-shared';
import { apId, Cursor, PlatformId, SeekPage } from '@activepieces/shared';
import { FastifyBaseLogger } from 'fastify';
import { repoFactory } from '../core/db/repo-factory';
import {
  OutgoingWebhookEntity,
  OutgoingWebhookSchema,
} from './outgoing-webhooks.entity';
import { buildPaginator } from '../helper/pagination/build-paginator';
import { paginationHelper } from '../helper/pagination/pagination-utils';

export const outgoingWebhookRepo = repoFactory<OutgoingWebhookSchema>(
  OutgoingWebhookEntity
);

export const outgoingWebhookService = (log: FastifyBaseLogger) => ({
  create: async (
    request: CreateOutgoingWebhookRequestBody,
    platformId: string
  ): Promise<OutgoingWebhook> => {
    return outgoingWebhookRepo().save({
      ...request,
      id: apId(),
      platformId,
    });
  },
  update: async ({ id, platformId, request }: UpdateParams): Promise<OutgoingWebhook> => {
    await outgoingWebhookRepo().update({ id, platformId }, {
      ...request,
    });
    return outgoingWebhookRepo().findOneByOrFail({ id, platformId });
  },
  delete: async ({ id, platformId }: deleteParams): Promise<void> => {
    await outgoingWebhookRepo().delete({
      id,
      platformId,
    });
  },
  list: async ({
    platformId,
    cursorRequest,
    limit,
  }: ListParams): Promise<SeekPage<OutgoingWebhook>> => {
    const decodedCursor = paginationHelper.decodeCursor(cursorRequest);
    const paginator = buildPaginator({
      entity: OutgoingWebhookEntity,
      query: {
        limit,
        afterCursor: decodedCursor.nextCursor,
        beforeCursor: decodedCursor.previousCursor,
      },
    });

    const queryBuilder = outgoingWebhookRepo()
      .createQueryBuilder('outgoing_webhook')
      .where({
        platformId,
      })

    const { data, cursor } = await paginator.paginate(queryBuilder);

    return paginationHelper.createPage<OutgoingWebhook>(data, cursor);
  },
});

type deleteParams = {
  id: string;
  platformId: string;
};

type UpdateParams = {
  id: string;
  platformId: string;
  request: UpdateOutgoingWebhookRequestBody;
};

type ListParams = {
  platformId: PlatformId;
  cursorRequest: Cursor;
  limit?: number;
};