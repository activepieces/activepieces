import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall } from '../common/client';
import { appIdDropdown, itemFields } from '../common/props';
import { PodioItem } from '../common/types';

export const createItemAction = createAction({
  name: 'create_item',
  displayName: 'Create Item',
  description: 'Creates a new item in a Podio app.',
  auth: podioAuth,
  props: {
    appId: appIdDropdown('App', true),
    fields: itemFields(),
  },
  async run(context) {
    const appId = context.propsValue.appId;
    const fields = context.propsValue.fields ?? {};

    if (!appId) {
      throw new Error('App ID is required.');
    }

    // Format fields for Podio API
    const formattedFields: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(fields)) {
      if (value !== null && value !== undefined && value !== '') {
        // Extract field ID from key (field_123 -> 123)
        const fieldId = key.replace('field_', '');
        
        // Format value based on field type
        if (Array.isArray(value)) {
          formattedFields[fieldId] = value;
        } else if (typeof value === 'string' && value.includes('T')) {
          // Date/datetime field
          formattedFields[fieldId] = [{ start: value }];
        } else {
          formattedFields[fieldId] = [{ value }];
        }
      }
    }

    // https://developers.podio.com/doc/items/add-new-item-22362
    const response = await podioApiCall<PodioItem>({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: `/item/app/${appId}/`,
      body: {
        fields: formattedFields,
      },
    });

    return response;
  },
});