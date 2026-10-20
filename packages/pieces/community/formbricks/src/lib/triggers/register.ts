import { HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { formBricksAuth } from '../common/auth';
import { encodeId, formbricksData, formbricksRequest, isFormbricksStatus, isRecord } from '../common/client';
import { formbricksApi } from '../common/api';
import { formbricksProps } from '../common/props';
import { formbricksSchemas } from '../common/schemas';
import { handleFormbricksWebhook, readStoredWebhook } from '../common/webhook';

export const formBricksRegisterTrigger = ({
  name,
  displayName,
  eventType,
  description,
  aiMetadata,
  sampleData,
}: {
  name: string;
  displayName: string;
  eventType: string;
  description: string;
  aiMetadata: { description: string };
  sampleData: unknown;
}) =>
  createTrigger({
    auth: formBricksAuth,
    name: `formbricks_trigger_${name}`,
    classification: 'READ',
    displayName,
    description,
    aiMetadata,
    props: {
      workspaceId: formbricksProps.workspace({
        required: true,
        description: 'The Formbricks workspace whose survey responses start this flow.',
      }),
      survey_id: formbricksProps.surveys({
        description: 'Only responses to these surveys start the flow. Leave empty to react to every survey in the workspace.',
      }),
    },
    sampleData,
    outputSchema: formbricksSchemas.webhookEvent,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const workspaceId = (context.propsValue.workspaceId ?? '').trim();
      if (workspaceId.length === 0) {
        throw new Error('Select the Formbricks workspace.');
      }
      const created = await formbricksData<unknown>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: '/api/v1/webhooks',
        body: {
          name: `Activepieces: ${displayName}`,
          workspaceId,
          url: context.webhookUrl,
          triggers: [eventType],
          surveyIds: context.propsValue.survey_id ?? [],
        },
      });
      if (!isRecord(created) || typeof created['id'] !== 'string') {
        throw new Error('Formbricks did not return the new webhook ID.');
      }
      await context.store.put<StoredWebhook>(storeKey(name), {
        webhookId: created['id'],
        secret: typeof created['secret'] === 'string' ? created['secret'] : null,
      });
    },
    async onDisable(context) {
      const stored = readStoredWebhook(await context.store.get<unknown>(storeKey(name)));
      if (stored.webhookId === null) {
        return;
      }
      try {
        await formbricksRequest({
          auth: context.auth,
          method: HttpMethod.DELETE,
          path: `/api/v1/webhooks/${encodeId({ id: stored.webhookId, label: 'Webhook ID' })}`,
        });
      } catch (error) {
        if (!isFormbricksStatus({ error, statuses: [404] })) {
          throw error;
        }
      }
      await context.store.delete(storeKey(name));
    },
    async test(context) {
      const surveyIds = context.propsValue.survey_id ?? [];
      const result = await formbricksApi.listResponses({
        auth: context.auth,
        surveyId: surveyIds.length === 1 ? surveyIds[0] : undefined,
        limit: 10,
        skip: 0,
      });
      return result.responses
        .filter((response) => surveyIds.length === 0 || (response.surveyId !== null && surveyIds.includes(response.surveyId)))
        .filter((response) => eventType !== 'responseFinished' || response.finished)
        .slice(0, 5)
        .map(({ contactId, ...response }) => ({
          webhookId: null,
          event: eventType,
          data: { ...response, contact: contactId === null ? null : { id: contactId } },
        }));
    },
    async run(context) {
      return handleFormbricksWebhook({
        payload: context.payload,
        store: context.store,
        storeKey: storeKey(name),
        eventType,
        nowMs: Date.now(),
      });
    },
  });

function storeKey(name: string): string {
  return `formbricks_${name}_trigger`;
}

type StoredWebhook = { webhookId: string; secret: string | null };
