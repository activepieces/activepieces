import { createAction } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { TeamworkProps } from '../common/props';
import { TeamworkClient } from '../common/client';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const createCompanyAction = createAction({
  auth: teamworkAuth,
  name: 'create_company',
  displayName: 'Create Company',
  description: 'Create a new company/client record in Teamwork.',
  props: {
    ...TeamworkProps.create_company_props,
  },
  async run(context) {
    const authToken = context.auth;
    const { propsValue } = context;

    const meResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://www.teamwork.com/launchpad/v1/auth/me',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: authToken,
      },
    });

    const siteName = meResponse.body['installedAccounts'][0]['siteName'];
    if (!siteName) {
      throw new Error('Failed to retrieve Teamwork site name from auth token.');
    }

    const clientAuth = {
      auth: authToken,
    };

    const client = new TeamworkClient(clientAuth, siteName);

    return await client.createCompany({
      name: propsValue.name,
      website: propsValue.website,
      email: propsValue.email,
      phone: propsValue.phone,
      address1: propsValue.address1,
      address2: propsValue.address2,
      city: propsValue.city,
      state: propsValue.state,
      zip: propsValue.zip,
      country: propsValue.country,
      description: propsValue.description,
      tags: propsValue.tags,
    });
  },
});
