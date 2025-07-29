import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall, getAccessToken, dynamicAppProperty, silentProperty, hookProperty, validateRequiredFields } from '../common';

export const createItemAction = createAction({
  auth: podioAuth,
  name: 'create_item',
  displayName: 'Create Item',
  description: 'Adds a new item to the given Podio app. This is a rate-limited operation (250 calls/hour).',
  props: {
    appId: dynamicAppProperty,
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'The external id of the item. This can be used to hold a reference to the item in an external system.',
      required: false,
    }),
    fields: Property.Object({
      displayName: 'Fields',
      description: 'The values for each field. Use field_id or external_id as keys. Values can be simple values, arrays, or objects with sub_ids.',
      required: true,
    }),
    fileIds: Property.Array({
      displayName: 'File IDs',
      description: 'Temporary files that have been uploaded and should be attached to this item',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The tags to put on the item',
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
      description: 'The linked account to use for the meeting',
      required: false,
    }),
    ref: Property.Object({
      displayName: 'Reference',
      description: 'The reference for the new item, if any. Format: {"type": "item", "id": reference_id}',
      required: false,
    }),
    hook: hookProperty,
    silent: silentProperty,
  },
  async run(context) {
    const accessToken = getAccessToken(context.auth);
    const { 
      appId, 
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
      throw new Error('App selection is required. Please select a Podio app from the dropdown.');
    }

    if (!fields || Object.keys(fields).length === 0) {
      throw new Error('At least one field value is required to create an item. Please provide field data.');
    }

    if (fileIds && !Array.isArray(fileIds)) {
      throw new Error('File IDs must be provided as an array of numbers.');
    }

    if (tags && !Array.isArray(tags)) {
      throw new Error('Tags must be provided as an array of strings.');
    }

    const body: any = {
      fields: fields,
    };

    if (externalId) {
      body.external_id = externalId;
    }

    if (fileIds && Array.isArray(fileIds) && fileIds.length > 0) {
      body.file_ids = fileIds;
    }

    if (tags && Array.isArray(tags) && tags.length > 0) {
      body.tags = tags;
    }

    if (reminder && typeof reminder === 'object' && Object.keys(reminder).length > 0) {
      if (reminder['remind_delta'] && typeof reminder['remind_delta'] === 'number') {
        body.reminder = reminder;
      }
    }

    if (recurrence && typeof recurrence === 'object' && Object.keys(recurrence).length > 0) {
      if (recurrence['name'] && recurrence['config']) {
        body.recurrence = recurrence;
      }
    }

    if (linkedAccountId) {
      body.linked_account_id = linkedAccountId;
    }

    if (ref && typeof ref === 'object' && Object.keys(ref).length > 0) {
      if (ref['type'] && ref['id']) {
        body.ref = ref;
      }
    }

    const queryParams: any = {};
    if (typeof hook === 'boolean') {
      queryParams.hook = hook.toString();
    }
    if (typeof silent === 'boolean') {
      queryParams.silent = silent.toString();
    }

    const response = await podioApiCall<{
      item_id: number;
      title: string;
    }>({
      method: HttpMethod.POST,
      accessToken,
      resourceUri: `/item/app/${appId}/`,
      body,
      queryParams,
    });

    return response;
  },
}); 