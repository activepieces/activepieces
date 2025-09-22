import { createAction } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { TeamworkProps } from '../common/props';
import { TeamworkClient } from '../common/client';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const createNotebookCommentAction = createAction({
  auth: teamworkAuth,
  name: 'create_notebook_comment',
  displayName: 'Create Notebook Comment',
  description: 'Add a comment to a notebook with optional attachments.',
  props: {
    ...TeamworkProps.create_notebook_comment_props,
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

    return await client.createNotebookComment(
      propsValue.notebook_id as string,
      {
        content: propsValue.content,
        notifyUserIds: propsValue.notify_user_ids as string[],
        attachments: propsValue.attachments as string[],
      }
    );
  },
});
