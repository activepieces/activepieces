import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, silentProperty, hookProperty, dynamicAppProperty, dynamicItemProperty } from '../common';

export const updateItemAction = createAction({
  auth: podioAuth,
  name: 'update_item',
  displayName: 'Update Item',
  description: 'Update an already existing item. This is a rate-limited operation (250 calls/hour). Values will only be updated for fields included. To delete all values for a field supply an empty array.',
  props: {
    appId: dynamicAppProperty,
    itemId: dynamicItemProperty,
    revision: Property.Number({
      displayName: 'Revision',
      description: 'The revision of the item that is being updated. Optional for conflict detection.',
      required: false,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'The new external_id of the item',
      required: false,
    }),
    fields: Property.Object({
      displayName: 'Fields',
      description: 'The values for each field. Use field_id or external_id as keys. To delete all values for a field supply an empty array.',
      required: false,
    }),
    fileIds: Property.Array({
      displayName: 'File IDs',
      description: 'The list of attachments',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The list of tags',
      required: false,
    }),
    reminder: Property.Object({
      displayName: 'Reminder',
      description: 'Optional reminder on this item. Format: {"remind_delta": minutes_before_due_date}',
      required: false,
    }),
    recurrence: Property.Object({
      displayName: 'Recurrence',
      description: 'The recurrence for the task, if any. Format: {"name": "weekly|monthly|yearly", "config": {...}, "step": 1, "until": "date"}',
      required: false,
    }),
    linkedAccountId: Property.Number({
      displayName: 'Linked Account ID',
      description: 'The linked account to use for meetings',
      required: false,
    }),
    ref: Property.Object({
      displayName: 'Reference',
      description: 'The reference of the item. Format: {"type": "reference_type", "id": reference_id}',
      required: false,
    }),
    hook: hookProperty,
    silent: silentProperty,
  },
  async run(context) {
    const accessToken = getAccessToken(context.auth);
    const { 
      appId,
      itemId, 
      revision, 
      externalId, 
      fields, 
      fileIds, 
      tags, 
      reminder, 
      recurrence, 
      linkedAccountId, 
      ref, 
      hook, 
      silent 
    } = context.propsValue;

    if (!appId) {
      throw new Error('App selection is required to update an item. Please select an app first.');
    }

    if (!itemId) {
      throw new Error('Item selection is required to update an item. Please select an item from the dropdown.');
    }

    if (fileIds && !Array.isArray(fileIds)) {
      throw new Error('File IDs must be provided as an array of numbers.');
    }

    if (tags && !Array.isArray(tags)) {
      throw new Error('Tags must be provided as an array of strings.');
    }

    if (reminder && reminder['remind_delta'] !== undefined && typeof reminder['remind_delta'] !== 'number') {
      throw new Error('Reminder remind_delta must be a number representing minutes before due date.');
    }

    if (linkedAccountId && typeof linkedAccountId !== 'number') {
      throw new Error('Linked Account ID must be a number.');
    }

    if (ref && (!ref['type'] || !ref['id'])) {
      throw new Error('Reference must include both "type" and "id" properties.');
    }

    const body: any = {};

    if (revision !== undefined) {
      if (typeof revision !== 'number') {
        throw new Error('Revision must be a number.');
      }
      body.revision = revision;
    }

    if (externalId && externalId.trim()) {
      body.external_id = externalId.trim();
    }

    if (fields !== undefined) {
      body.fields = fields;
    }

    if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      body.file_ids = fileIds;
    }

    if (tags && Array.isArray(tags) && tags.length > 0) {
      body.tags = tags;
    }

    if (reminder) {
      body.reminder = reminder;
    }

    if (recurrence) {
      body.recurrence = recurrence;
    }

    if (linkedAccountId) {
      body.linked_account_id = linkedAccountId;
    }

    if (ref) {
      body.ref = ref;
    }

    const queryParams: any = {};
    if (typeof hook === 'boolean') {
      queryParams.hook = hook.toString();
    }
    if (typeof silent === 'boolean') {
      queryParams.silent = silent.toString();
    }

    const response = await podioApiCall<{
      revision: number;
      title: string;
    }>({
      method: HttpMethod.PUT,
      accessToken,
      resourceUri: `/item/${itemId}`,
      body,
      queryParams,
    });

    return response;
  },
}); 