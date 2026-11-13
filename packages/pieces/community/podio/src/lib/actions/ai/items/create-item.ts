import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioCreateItemOutputSchema } from '../../../output-schemas';

export const createItemAction = createAction({
  auth: podioAuth,
  name: 'podio_create_item',
  outputSchema: podioCreateItemOutputSchema,
  displayName: 'Create Item',
  description: 'Adds a new item to a Podio app.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates an item in a Podio app from a fields map keyed by field id or field external id. The app id comes from List Apps in Space and the field ids and external ids from Get App; file ids come from Upload File.',
    idempotent: false,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app to add the item to, from List Apps in Space or Get App.' }),
    fields: podioAiProps.json({
      required: true,
      displayName: 'Fields',
      description: 'The field values keyed by field id or field external id, e.g. {"title": "Acme", "status": 2, "due-date": {"start": "2026-11-04"}}. A field takes a single value, a sub-value object or a list of either.',
    }),
    externalId: podioAiProps.text({ required: false, displayName: 'External ID', description: 'An id of the item in an external system, usable later with Get Item by External ID.' }),
    fileIds: podioAiProps.idList({ required: false, displayName: 'File IDs', description: 'Ids of uploaded files to attach, from Upload File.' }),
    tags: podioAiProps.idList({ required: false, displayName: 'Tags', description: 'Tag texts to put on the item.' }),
    remindDelta: podioAiProps.number({ required: false, displayName: 'Reminder (Minutes Before)', description: 'For meeting items: minutes before the due date to send a reminder.' }),
    recurrence: podioAiProps.json({
      required: false,
      displayName: 'Recurrence',
      description: 'For meeting items: {"name": "weekly" | "monthly" | "yearly", "config": {"days": ["monday"]} or {"repeat_on": "day_of_week" | "day_of_month"}, "step": 1, "until": "2026-12-31"}.',
    }),
    linkedAccountId: podioAiProps.id({ required: false, displayName: 'Linked Account ID', description: 'For meeting items: the linked account to host the meeting, from Get Linked Accounts.' }),
    refItemId: podioAiProps.id({ required: false, displayName: 'Reference Item ID', description: 'The id of an item the new item refers to.' }),
    hook: podioAiProps.hook({ required: false }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/item/app/${propsValue.appId}/`,
      query: podioUtils.query({ values: { hook: propsValue.hook, silent: propsValue.silent } }),
      body: podioUtils.body({
        values: {
          fields: propsValue.fields,
          external_id: propsValue.externalId,
          file_ids: propsValue.fileIds?.length ? propsValue.fileIds.map((id) => Number(id)) : undefined,
          tags: propsValue.tags?.length ? propsValue.tags : undefined,
          reminder: propsValue.remindDelta === undefined || propsValue.remindDelta === null ? undefined : { remind_delta: propsValue.remindDelta },
          recurrence: propsValue.recurrence && Object.keys(propsValue.recurrence).length > 0 ? propsValue.recurrence : undefined,
          linked_account_id: propsValue.linkedAccountId ? Number(propsValue.linkedAccountId) : undefined,
          ref: propsValue.refItemId ? { type: 'item', id: Number(propsValue.refItemId) } : undefined,
        },
      }),
    });
  },
});
