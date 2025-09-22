import { createAction } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { TeamworkProps } from '../common/props';
import { TeamworkClient } from '../common/client';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const createPersonAction = createAction({
  auth: teamworkAuth,
  name: 'create_person',
  displayName: 'Create Person',
  description: 'Create a new user or contact.',
  props: {
    ...TeamworkProps.create_person_props,
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

    return await client.createPerson({
      firstName: propsValue.first_name,
      lastName: propsValue.last_name,
      emailAddress: propsValue.email_address,
      companyId: propsValue.company_id,
      userType: propsValue.user_type,
      title: propsValue.title,
      isClientUser: propsValue.is_client_user,
      sendInvite: propsValue.send_invite,
    });
  },
});
