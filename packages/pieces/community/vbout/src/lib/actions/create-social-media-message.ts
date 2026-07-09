import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../auth';
import { makeClient, vboutCommon } from '../common';
export const createSocialMediaMessageAction = createAction({
  auth: vboutAuth,
  name: 'vbout_create_social_media_message',
  displayName: 'Create Social Media Message',
  description: 'Post a message to one of your social media channel.',
  audience: 'both',
  aiMetadata: {
    description: 'Publishes a message to one connected VBOUT social media account on a chosen channel (Twitter, LinkedIn, or Facebook). Use to post content to social media. Requires the message text, the channel, and the specific account/profile ID on that channel; not idempotent, as each call creates a new post.',
    idempotent: false,
  },
  props: {
    message: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
    channel: vboutCommon.socialMediaChannel,
    channelid: vboutCommon.socialMediaProfile,
  },
  async run(context) {
    const client = makeClient(context.auth.secret_text);
    return await client.createSocialMediaPost(context.propsValue);
  },
});
