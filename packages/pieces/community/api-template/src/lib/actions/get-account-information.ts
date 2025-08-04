import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';
import { apitemplateAuth } from '../../index';

export const apitemplateGetAccountInformationAction = createAction({
  auth: apitemplateAuth,
  name: 'get_account_information',
  displayName: 'Get Account Information',
  description: 'Retrieve account details such as usage limits and template quotas',
  props: {},
  async run(context) {
    const { auth } = context;

    const response = await httpClient.sendRequest<{
      status: string;
      subscription_product?: string;
      subscription_current_period_start?: string;
      subscription_current_period_end?: string;
      subscription_status?: string;
      subscription_interval?: string;
      api_quota?: number;
      api_remaining?: number;
      api_used?: string;
      template_remaining?: number;
      template_count?: number;
      template_quota?: number;
      message?: string;
    }>({
      method: HttpMethod.GET,
      url: 'https://rest.apitemplate.io/v2/account',
      headers: {
        'X-API-KEY': auth as string,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      return response.body;
    }

    throw new Error(`Failed to get account information: ${response.status}`);
  },
}); 