
    import { httpClient, HttpMethod } from '@activepieces/pieces-common';
    import { createAction, Property } from '@activepieces/pieces-framework';
    import { SlackAuth } from '../..';

    export const update_message = createAction({
      auth: SlackAuth,
      name: 'update_message',
      displayName: 'Update Message',
      description: 'Update an existing message',
      props: {
    channel: Property.ShortText({
      displayName: 'Channel ID of the message to update',
      required: true,
    }),
    ts: Property.ShortText({
      displayName: 'Timestamp of the message to update',
      required: true,
    }),
    text: Property.ShortText({
      displayName: 'Updated text of the message',
      required: true,
    }),},
      run: async (ctx) => {
        return await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: `https://slack.com/api/chat.update`,
          headers: {
            Authorization: `${ctx.auth}`,
          },
          body: ctx.propsValue,
        }).then(res => res.body);
      },
    });
  