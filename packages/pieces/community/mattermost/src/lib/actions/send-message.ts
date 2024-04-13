import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpMethod,
} from '@activepieces/pieces-common';
import { mattermostAuth } from '../..';

export const sendMessage = createAction({
  auth: mattermostAuth,
  name: 'send_message',
  displayName: 'Send Message',
  description: 'Send a message to a Mattermost channel',
  props: {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description:
        'The channel to send the message to, get that ID by clicking on info near start call butto',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message Text',
      description: 'The text of the message to send',
      required: true,
    }),
  },
  async run(context) {
    // Remove trailing slash from workspace URL
    const baseUrl = context.auth.workspace_url.replace(/\/$/, '');
    try {
      return await httpClient.sendRequest({
        url: `${baseUrl}/api/v4/posts`,
        method: HttpMethod.POST,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.token,
        },
        body: {
          channel_id: context.propsValue.channel_id,
          message: context.propsValue.text,
        },
      });
    } catch (e: HttpError | unknown) {
      if (e instanceof HttpError) {
        const httpError = e as HttpError;
        console.log(httpError);
        if (httpError?.response.status === 403) {
          throw new Error(
            'Please make sure you have the correct bot token and channel ID.'
          );
        }
      }
      throw e;
    }
  },
});
