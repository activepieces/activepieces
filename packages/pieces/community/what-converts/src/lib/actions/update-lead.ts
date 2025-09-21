import { createAction, Property } from '@activepieces/pieces-framework';
import { whatConvertsAuth } from '../common/auth';
import { whatConvertsClient } from '../common/client';
import { leadDropdown } from '../common/props';

export const updateLead = createAction({
  auth: whatConvertsAuth,
  name: 'update_lead',
  displayName: 'Update Lead',
  description: 'Update an existing lead in WhatConverts.',
  props: {
    lead_id: leadDropdown(),
    quotable: Property.StaticDropdown({
      displayName: 'Quotable',
      description: 'The quotable type for this lead.',
      required: false,
      options: {
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
          { label: 'Pending', value: 'pending' },
          { label: 'Not Set', value: 'not_set' },
        ],
      },
    }),
    quote_value: Property.Number({
      displayName: 'Quote Value',
      required: false,
    }),
    sales_value: Property.Number({
      displayName: 'Sales Value',
      required: false,
    }),
    lead_url: Property.ShortText({
        displayName: 'Lead URL',
        description: 'The URL where the lead took place.',
        required: false,
    }),
    additional_fields: Property.Object({
      displayName: 'Additional Fields',
      description: 'Update or add additional fields as key-value pairs.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { lead_id, ...payload } = propsValue;


    return await whatConvertsClient.updateLead(auth, lead_id as number, payload);
  },
});