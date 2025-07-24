import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { podioAuth } from '../../index';
import { podioApiCall } from '../common/client';
import { itemFields } from '../common/props';
import { PodioItem } from '../common/types';

export const updateItemAction = createAction({
  name: 'update_item',
  displayName: 'Update Item',
  description: 'Updates an existing item in Podio.',
  auth: podioAuth,
  props: {
    itemId: Property.Number({
      displayName: 'Item ID',
      description: 'The ID of the item to update',
      required: true,
    }),
    fields: itemFields(),
  },
  async run(context) {
    const itemId = context.propsValue.itemId;
    const fields = context.propsValue.fields ?? {};

    if (!itemId) {
      throw new Error('Item ID is required.');
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

    // https://developers.podio.com/doc/items/update-item-22363
    const response = await podioApiCall<PodioItem>({
      auth: context.auth,
      method: HttpMethod.PUT,
      resourceUri: `/item/${itemId}`,
      body: {
        fields: formattedFields,
      },
    });

    return response;
  },
});