import { Property, createAction } from '@activepieces/pieces-framework';
import { closeAuth } from '../..';
import { makeClient } from '../common/client';
import { CloseCRMDeal } from '../common/types';

export const updateDeal = createAction({
  auth: closeAuth,
  name: 'update_deal',
  displayName: 'Update Deal',
  description: 'Updates an existing deal/opportunity in Close CRM',
  props: {
    deal_id: Property.ShortText({
      displayName: 'Deal ID',
      description: 'The ID of the deal to update',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Update the deal status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Won', value: 'won' },
          { label: 'Lost', value: 'lost' },
          { label: 'Archived', value: 'archived' },
        ],
      },
    }),
    value: Property.Number({
      displayName: 'Deal Value',
      description: 'The monetary value of the deal',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Add or update a note on the deal',
      required: false,
    }),
    customFields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Additional custom fields to update',
      required: false,
    }),
  },
  async run(context) {
    const { deal_id, status, value, note, customFields } = context.propsValue;
    const client = makeClient(context.auth);

    const updateData: CloseCRMDeal = {
      ...(status && { status }),
      ...(value && { value }),
      ...(note && { note }),
      ...customFields,
    };

    try {
      const response = await client.put(`/opportunity/${deal_id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating deal:', error);
      throw new Error(`Failed to update deal: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});