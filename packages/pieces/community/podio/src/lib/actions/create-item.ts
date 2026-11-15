import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { podioApi } from '../common/api';
import { podioClient } from '../common/client';
import { podioProps } from '../common/props';
import { podioUtils } from '../common/utils';
import { podioAuth } from '../auth';
import { createItemOutputSchema } from '../output-schemas';

export const createItemAction = createAction({
  auth: podioAuth,
  name: 'create_item',
  outputSchema: createItemOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Item',
  description: 'Create a new record in a Podio app with specified field values.',
  audience: 'human',
  aiMetadata: { description: 'Creates a new item (record) in a specified Podio app, populating its fields. Field values can be supplied via the structured app-field inputs or, for complex cases, a raw legacy-fields JSON map keyed by field id. Use when adding a record to a Podio app; requires an app id and at least one field value. Not idempotent — each call creates a separate item.', idempotent: false },
  props: {
    orgId: podioProps.orgId({
      required: false,
      displayName: 'Organization (Optional)',
      description: 'Select an organization to filter apps by workspace. Leave empty to see all apps.',
    }),
    spaceId: podioProps.spaceId({
      required: false,
      displayName: 'Space (Optional)',
      description: 'Select a workspace to filter apps. Leave empty to see all apps in the organization.',
    }),
    appId: podioProps.appId({ required: true }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'The external id of the item. This can be used to hold a reference to the item in an external system.',
      required: false,
    }),
    
    appFields: podioProps.itemFields({ required: true }),
    legacyFields: Property.Object({
      displayName: 'Advanced: Custom Fields JSON',
      description: 'Advanced: Use this for complex field configurations. Format: {"field_id": {"value": "content"}}. Only use if the dynamic fields above don\'t meet your needs.',
      required: false,
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
    hook: podioProps.hook({ required: false }),
    silent: podioProps.silent({ required: false }),
  },
  async run(context) {
    const { 
      orgId,
      spaceId,
      appId, 
      externalId, 
      appFields,
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
      throw new Error('App selection is required. Please select a Podio app from the dropdown.');
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

    if (Object.keys(formattedFields).length === 0) {
      throw new Error('At least one field value is required to create an item. Please configure the app fields or provide legacy field data.');
    }

    if (fileIds && !Array.isArray(fileIds)) {
      throw new Error('File IDs must be provided as an array of numbers.');
    }

    if (tags && !Array.isArray(tags)) {
      throw new Error('Tags must be provided as an array of strings.');
    }

    const body: CreateItemBody = {
      fields: formattedFields,
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

    const queryParams: QueryParams = {};
    if (typeof hook === 'boolean') {
      queryParams['hook'] = hook.toString();
    }
    if (typeof silent === 'boolean') {
      queryParams['silent'] = silent.toString();
    }

    return await podioClient.request<{
      item_id: number;
      title: string;
    }>({
      method: HttpMethod.POST,
      auth: context.auth,
      path: `/item/app/${appId}/`,
      body,
      query: queryParams,
    });
  },
});

type CreateItemBody = {
  fields: Record<string, unknown>;
  external_id?: string;
  file_ids?: unknown[];
  tags?: unknown[];
  reminder?: Record<string, unknown>;
  recurrence?: Record<string, unknown>;
  linked_account_id?: number;
  ref?: Record<string, unknown>;
};
