import { createAction } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { TeamworkProps } from '../common/props';
import { TeamworkClient } from '../common/client';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const createMilestoneAction = createAction({
  auth: teamworkAuth,
  name: 'create_milestone',
  displayName: 'Create Milestone',
  description:
    'Add a milestone with due date, description, responsible user, etc.',
  props: {
    ...TeamworkProps.create_milestone_props,
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

    return await client.createMilestone(propsValue.project_id as string, {
      content: propsValue.content,
      dueDate: propsValue.due_date,
      responsiblePartyId: propsValue.responsible_party_id,
      private: propsValue.private,
      notify: propsValue.notify,
      canComplete: propsValue.can_complete,
    });
  },
});
