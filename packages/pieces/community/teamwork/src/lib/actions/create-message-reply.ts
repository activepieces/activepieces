import { createAction } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { TeamworkProps } from '../common/props';
import { TeamworkClient } from '../common/client';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const createMessageReplyAction = createAction({
  auth: teamworkAuth,
  name: 'create_message_reply',
  displayName: 'Create Message Reply',
  description: 'Post a reply to a message thread.',
  props: {
    ...TeamworkProps.create_message_reply_props,
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

    return await client.createMessageReply(propsValue.message_id, {
      content: propsValue.content,
      notifyUserIds: propsValue.notify_user_ids,
      isPrivate: propsValue.is_private,
    });
  },
});
