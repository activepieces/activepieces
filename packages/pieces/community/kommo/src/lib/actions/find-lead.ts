import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../../index';

export const findLeadAction = createAction({
  auth: kommoAuth,
  name: 'find_lead',
  displayName: 'Find Lead',
  description: "Retrieve a lead's details by ID",
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      required: true,
    }),
  },
  async run(context) {
    const { leadId } = context.propsValue;
    const { subdomain, apiToken } = context.auth as {
      subdomain: string;
      apiToken: string;
    };

    const result = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.GET,
      `/leads/${leadId}`
    );

    return result;
  },
});
