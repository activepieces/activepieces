
    import { httpClient, HttpMethod } from '@activepieces/pieces-common';
    import { createAction, Property } from '@activepieces/pieces-framework';
    import { SlackAuth } from '../..';

    export const send_channel_message = createAction({
      auth: SlackAuth,
      name: 'send_channel_message',
      displayName: 'Send Message to a Channel',
      description: 'Send a message to a specified channel',
      props: {
    channel: Property.ShortText({
      displayName: 'Channel ID to send the message to',
      required: true,
    }),
    text: Property.ShortText({
      displayName: 'Text of the message',
      required: true,
    }),
    thread_ts: Property.ShortText({
      displayName: 'Thread timestamp for reply',
      required: false,
    }),},
      run: async (ctx) => {
        return await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: `https://slack.com/api/chat.postMessage`,
          headers: {
            Authorization: `${ctx.auth}`,
          },
          body: ctx.propsValue,
        }).then(res => res.body);
      },
    });
  