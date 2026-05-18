import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';

export const instantlyAddLeadAction = createAction({
  auth: instantlyAuth,
  name: 'add_lead',
  description: 'Add a lead to a campaign in Instantly.ai',
  displayName: 'Add Lead',
  props: {
    campaign_id: Property.ShortText({
      displayName: 'Campaign ID',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    custom_variables: Property.Object({
      displayName: 'Custom Variables',
      required: false,
    }),
    skip_if_in_workspace: Property.Checkbox({
      displayName: 'Skip if in workspace',
      required: false,
      defaultValue: false,
    }),
    skip_if_in_campaign: Property.Checkbox({
      displayName: 'Skip if in campaign',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { campaign_id, email, first_name, last_name, company_name, custom_variables, skip_if_in_workspace, skip_if_in_campaign } = context.propsValue;
    const { apiKey } = context.auth;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://api.instantly.ai/api/v2/leads/add',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        campaign_id,
        skip_if_in_workspace,
        skip_if_in_campaign,
        leads: [
          {
            email,
            first_name,
            last_name,
            company_name,
            custom_variables,
          },
        ],
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
