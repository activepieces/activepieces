import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../../index';
import { leadDropdown } from '../common/props';

export const findLeadAction = createAction({
  auth: kommoAuth,
  name: 'find_lead',
  displayName: 'Find Lead',
  description: "Retrieve a lead's details by ID",
  props: {
    leadId: leadDropdown,
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
