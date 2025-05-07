import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { InstantlyCommon } from '../common';
import { instantlyAuth } from '../../index';

export const createLeadListAction = createAction({
  auth: instantlyAuth,
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
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to associate with the lead list',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      description,
      tags,
    } = context.propsValue;
    const { auth: apiKey } = context;

    const payload: Record<string, unknown> = {
      name,
    };

    if (description) {
      payload.description = description;
    }

    if (tags && tags.length > 0) {
      payload.tags = tags;
    }

    const response = await InstantlyCommon.makeRequest({
      endpoint: 'lead-lists',
      method: HttpMethod.POST,
      apiKey: apiKey as string,
      body: payload,
    });

    return response;
  },
});
