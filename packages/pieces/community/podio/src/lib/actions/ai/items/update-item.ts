import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioUpdateItemOutputSchema } from '../../../output-schemas';

export const updateItemAction = createAction({
  auth: podioAuth,
  name: 'podio_update_item',
  outputSchema: podioUpdateItemOutputSchema,
  displayName: 'Update Item',
  description: 'Updates an existing Podio item; only the fields given change.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates a Podio item: only the fields in the fields map change, and a field set to [] is cleared. Pass the revision from Get Item to fail with a conflict instead of overwriting someone else\'s newer change. The item id comes from Filter Items or Get Item; field ids from Get App.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the item, from Filter Items, Get Item or Create Item.' }),
    fields: podioAiProps.json({
      required: false,
      displayName: 'Fields',
      description: 'The field values to set, keyed by field id or field external id, e.g. {"title": "Acme", "status": 2}. Use [] as a value to clear a field.',
    }),
    revision: podioAiProps.number({ required: false, displayName: 'Revision', description: 'The current_revision.revision from Get Item; the update fails with a conflict if the item changed since.' }),
    externalId: podioAiProps.text({ required: false, displayName: 'External ID', description: 'A new external id for the item.' }),
    fileIds: podioAiProps.idList({ required: false, displayName: 'File IDs', description: 'The full list of file ids attached to the item, from Upload File; replaces the current attachments. An empty list leaves them unchanged.' }),
    tags: podioAiProps.idList({ required: false, displayName: 'Tags', description: 'The full list of tag texts on the item; replaces the current tags. An empty list leaves them unchanged.' }),
    remindDelta: podioAiProps.number({ required: false, displayName: 'Reminder (Minutes Before)', description: 'For meeting items: minutes before the due date to send a reminder.' }),
    recurrence: podioAiProps.json({
      required: false,
      displayName: 'Recurrence',
      description: 'For meeting items: {"name": "weekly" | "monthly" | "yearly", "config": {...}, "step": 1, "until": "2026-12-31"}.',
    }),
    linkedAccountId: podioAiProps.id({ required: false, displayName: 'Linked Account ID', description: 'For meeting items: the linked account to host the meeting, from Get Linked Accounts.' }),
    hook: podioAiProps.hook({ required: false }),
    silent: podioAiProps.silent({ required: false }),
  },
  async run({ auth, propsValue }) {
    const body = podioUtils.body({
      values: {
        revision: propsValue.revision ?? undefined,
        external_id: propsValue.externalId,
        fields: propsValue.fields && Object.keys(propsValue.fields).length > 0 ? propsValue.fields : undefined,
        file_ids: propsValue.fileIds?.length ? propsValue.fileIds.map((id) => Number(id)) : undefined,
        tags: propsValue.tags?.length ? propsValue.tags : undefined,
        reminder: propsValue.remindDelta === undefined || propsValue.remindDelta === null ? undefined : { remind_delta: propsValue.remindDelta },
        recurrence: propsValue.recurrence && Object.keys(propsValue.recurrence).length > 0 ? propsValue.recurrence : undefined,
        linked_account_id: propsValue.linkedAccountId ? Number(propsValue.linkedAccountId) : undefined,
      },
    });
    if (Object.keys(body).every((key) => key === 'revision')) {
      throw new Error('Nothing to update: set Fields, External ID, File IDs, Tags, Reminder, Recurrence or Linked Account ID.');
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/item/${propsValue.itemId}`,
      query: podioUtils.query({ values: { hook: propsValue.hook, silent: propsValue.silent } }),
      body,
    });
  },
});
