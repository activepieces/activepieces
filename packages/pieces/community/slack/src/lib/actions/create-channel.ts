import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { slackAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';

export const createChannelAction = createAction({
  auth: slackAuth,
  name: 'slack-create-channel',
  displayName: 'Create Channel',
  description: 'Creates a new channel.',
  props: {
    channelName: Property.ShortText({
      displayName: 'Channel Name',
      required: true,
    }),
    isPrivate: Property.Checkbox({
      displayName: 'Is Private?',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const channelName = context.propsValue.channelName;
    const isPrivate = context.propsValue.isPrivate;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://slack.com/api/conversations.create',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      body: {
        name: channelName,
        is_private: isPrivate,
      },
    };

    const response = await httpClient.sendRequest(request);

    if (!response.body.ok) {
      throw new Error(JSON.stringify(response.body, undefined, 2));
    }

    return response.body;
  },
});
