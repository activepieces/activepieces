import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { mattermostAuth } from '../auth';
import { mattermostClient } from '../common/client';
import { mattermostSendMessageOutputSchema } from '../output-schemas';

export const sendMessageAction = createAction({
  auth: mattermostAuth,
  name: 'send_message',
  outputSchema: mattermostSendMessageOutputSchema,
  classification: 'WRITE',
  displayName: 'Send Message',
  description: 'Send a message to a Mattermost channel',
  audience: 'human',
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
    try {
      return await mattermostClient.send<unknown>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: '/posts',
        body: {
          channel_id: context.propsValue.channel_id,
          message: context.propsValue.text,
        },
      });
    } catch (e) {
      if (e instanceof HttpError && e.response.status === 403) {
        throw new Error(
          'Please make sure you have the correct bot token and channel ID.'
        );
      }
      throw e;
    }
  },
});
