import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { podioApi } from '../common/api';
import { podioClient } from '../common/client';
import { podioProps } from '../common/props';
import { podioUtils } from '../common/utils';
import { podioAuth } from '../auth';
import { podioUpdateItemOutputSchema } from '../output-schemas';

export const updateItemAction = createAction({
  auth: podioAuth,
  name: 'update_item',
  outputSchema: podioUpdateItemOutputSchema,
  classification: 'WRITE',
  displayName: 'Update Item',
  description: 'Update an existing record in a Podio app with specified field values. Only provided fields will be updated.',
  audience: 'human',
  aiMetadata: { description: 'Updates fields on an existing Podio item identified by item id; only the fields you supply are changed (via structured app-field inputs or a raw legacy-fields JSON map). Use when modifying an existing record rather than creating one; requires the app id and item id. Idempotent — repeating with the same values leaves the item in the same state.', idempotent: true },
  props: {
    appId: podioProps.appId({ required: true }),
    itemId: podioProps.itemId({ required: true }),
    appFields: podioProps.itemUpdateFields({ required: false }),
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
    legacyFields: Property.Object({
      displayName: 'Legacy Fields (Advanced)',
      description: 'Manual field configuration using field_id or external_id as keys. Use this for advanced scenarios or when dynamic fields are not sufficient.',
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
    hook: podioProps.hook({ required: false }),
    silent: podioProps.silent({ required: false }),
  },
  async run(context) {    
    const { 
      appId,
      itemId, 
      appFields,
      revision, 
      externalId, 
      legacyFields, 
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

    let formattedFields: Record<string, unknown> = {};
    
    if (appFields && Object.keys(appFields).length > 0) {
      try {
        
        const app = await podioApi.getApp({ auth: context.auth, appId });
        
        const fieldDefinitions = app.fields || [];
        
        formattedFields = podioUtils.formatFieldValues({ appFields: fieldDefinitions, formData: appFields });
      } catch (error) {
        throw new Error(`Failed to process app fields: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (legacyFields && typeof legacyFields === 'object' && Object.keys(legacyFields).length > 0) {
      formattedFields = { ...formattedFields, ...legacyFields };
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

    if (ref && Object.keys(ref).length > 0 && (!ref['type'] || !ref['id'])) {
      throw new Error('Reference must include both "type" and "id" properties.');
    }

    const body: UpdateItemBody = {};

    if (revision !== undefined) {
      if (typeof revision !== 'number') {
        throw new Error('Revision must be a number.');
      }
      body.revision = revision;
    }

    if (externalId && externalId.trim()) {
      body.external_id = externalId.trim();
    }

    if (Object.keys(formattedFields).length > 0) {
      body.fields = formattedFields;
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

    const queryParams: QueryParams = {};
    if (typeof hook === 'boolean') {
      queryParams['hook'] = hook.toString();
    }
    if (typeof silent === 'boolean') {
      queryParams['silent'] = silent.toString();
    }

    return await podioClient.request<{
      revision: number;
      title: string;
    }>({
      method: HttpMethod.PUT,
      auth: context.auth,
      path: `/item/${itemId}`,
      body,
      query: queryParams,
    });
  },
});

type UpdateItemBody = {
  revision?: number;
  external_id?: string;
  fields?: Record<string, unknown>;
  file_ids?: unknown[];
  tags?: unknown[];
  reminder?: Record<string, unknown>;
  recurrence?: Record<string, unknown>;
  linked_account_id?: number;
  ref?: Record<string, unknown>;
};
