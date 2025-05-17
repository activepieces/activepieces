import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { instantlyAiAuth } from '../../index';

export const createLeadListAction = createAction({
  auth: instantlyAiAuth,
  name: 'create_lead_list',
  displayName: 'Create Lead List',
  description: 'Create a new list for organizing leads in Instantly',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'Name of the lead list',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description of the lead list',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      description,
    } = context.propsValue;
    const { auth: apiKey } = context;

    const payload: Record<string, unknown> = {
      name,
    };

    if (description) {
      payload['description'] = description;
    }

    return await makeRequest({
      endpoint: 'lead-lists',
      method: HttpMethod.POST,
      apiKey: apiKey as string,
      body: payload,
    });
  },
});
