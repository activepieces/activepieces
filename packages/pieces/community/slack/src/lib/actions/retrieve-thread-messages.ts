import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../..';
import { WebClient } from '@slack/web-api';
import { slackChannel } from '../common/props';

export const retrieveThreadMessages = createAction({
  name: 'retrieveThreadMessages',
  displayName: 'Retrieve thread messages',
  description: 'Retrieves thread messages by channel and thread timestamp',
  auth: slackAuth,
  props: {
    channel: slackChannel(true),
    threadTs: Property.ShortText({
      displayName: 'Thread ts',
      description:
        'Provide the ts (timestamp) value of the **parent** message to retrieve replies of this message. Do not use the ts value of the reply itself; use its parent instead. For example `1710304378.475129`.Alternatively, you can easily obtain the message link by clicking on the three dots next to the parent message and selecting the `Copy link` option.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(auth.access_token);
    return await client.conversations.replies({
      channel: propsValue.channel,
      ts: propsValue.threadTs,
    });
  },
});
