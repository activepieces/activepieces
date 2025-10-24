import {
  ApplicationEventName,
  CreateOutgoingWebhookRequestBody,
  FlowCreatedEvent,
  OutgoingWebhook,
  OutgoingWebhookScope,
  UpdateOutgoingWebhookRequestBody,
} from '@activepieces/ee-shared';
import { ActivepiecesError, ApId, apId, assertNotNullOrUndefined, Cursor, ErrorCode, PlatformId, ProjectId, SeekPage, WorkerJobType } from '@activepieces/shared';
import { FastifyBaseLogger } from 'fastify';
import { repoFactory } from '../../core/db/repo-factory';
import {
  OutgoingWebhookEntity,
  OutgoingWebhookSchema,
} from './outgoing-webhooks.entity';
import { buildPaginator } from '../../helper/pagination/build-paginator';
import { paginationHelper } from '../../helper/pagination/pagination-utils';
import { jobQueue } from '../../workers/queue/job-queue';
import { JobType } from '../../workers/queue/queue-manager';
import { AddAPArrayContainsToQueryBuilder } from '../../database/database-connection';
import { faker } from '@faker-js/faker'
import { WorkerSystemProp } from '@activepieces/server-shared';
import { system } from '../../helper/system/system';

export const outgoingWebhookRepo = repoFactory<OutgoingWebhookSchema>(
  OutgoingWebhookEntity
);

export const outgoingWebhookService = (log: FastifyBaseLogger) => ({
  create: async (
    request: CreateOutgoingWebhookRequestBody,
    platformId: string
  ): Promise<OutgoingWebhook> => {
    assertUrlIsExternal(request.url)
    return outgoingWebhookRepo().save({
      ...request,
      id: apId(),
      platformId,
    });
  },
  update: async ({ id, platformId, request }: UpdateParams): Promise<OutgoingWebhook> => {
    assertUrlIsExternal(request.url)
    await outgoingWebhookRepo().update({ id, platformId }, {
      ...request,
    });
    return outgoingWebhookRepo().findOneByOrFail({ id, platformId });
  },
  delete: async ({ id, platformId }: DeleteParams): Promise<void> => {
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
  trigger: async ({ platformId, projectId, event, payload }: TriggerParams): Promise<void> => {
    const qb = outgoingWebhookRepo().createQueryBuilder('outgoing_webhook')
        .where('outgoing_webhook.scope = :platformScope AND outgoing_webhook.platformId = :platformId', {
            platformScope: OutgoingWebhookScope.PLATFORM,
            platformId,
        })

    if (projectId) {
        qb.orWhere('outgoing_webhook.scope = :projectScope AND outgoing_webhook.projectId = :projectId', {
            projectScope: OutgoingWebhookScope.PROJECT,
            projectId,
        })
    }            
    AddAPArrayContainsToQueryBuilder(qb, 'events', [event])
    const webhooks = await qb.getMany()

    await Promise.all(webhooks.map(webhook => 
        jobQueue(log).add({
            type: JobType.ONE_TIME,
            id: apId(),
            data: {
                platformId,
                projectId,
                webhookId: webhook.id,
                webhookUrl: webhook.url,
                payload,
                jobType: WorkerJobType.OUTGOING_WEBHOOK,
            },
        }),
    ))
  },
  test: async ({ platformId, projectId, url }: TestParams): Promise<void> => {
      await jobQueue(log).add({
          type: JobType.ONE_TIME,
          id: apId(),
          data: {
              platformId,
              projectId,
              webhookId: "test",
              webhookUrl: url,
              payload: createMockAuditEvent(),
              jobType: WorkerJobType.OUTGOING_WEBHOOK,
          },
      })
  },
});

const assertUrlIsExternal = (url: string) => {
    const frontendUrl = system.get(WorkerSystemProp.FRONTEND_URL)
    assertNotNullOrUndefined(frontendUrl, 'frontendUrl')
    if (new URL(url).host === new URL(frontendUrl).host) {
      throw new ActivepiecesError({
        code: ErrorCode.VALIDATION,
        params: {
          message: 'URL is not allowed',
        },
      })
    }
}

export const createMockAuditEvent = (): FlowCreatedEvent => {
  return {
      id:  apId(),
      created: faker.date.recent().toISOString(),
      updated: faker.date.recent().toISOString(),
      ip: faker.internet.ip(),
      platformId: apId(),
      projectId: apId(),
      userId: apId(),
      userEmail: faker.internet.email(),
      action: ApplicationEventName.FLOW_CREATED,
      data:  {
          flow: {
              id: apId(),
              created: faker.date.recent().toISOString(),
              updated: faker.date.recent().toISOString(),
          },
          project: {
              displayName: faker.lorem.word(),
          }
      },
      projectDisplayName: faker.lorem.word(),
  }
}

type DeleteParams = {
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

type TriggerParams = {
  platformId: PlatformId;
  projectId?: ProjectId;
  event: ApplicationEventName;
  payload: unknown;
};

type TestParams = {
  platformId: PlatformId;
  projectId: ProjectId;
  url: string;
};