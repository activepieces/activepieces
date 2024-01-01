import { Property, createAction } from '@activepieces/pieces-framework';
import { vboutAuth } from '../../';
import { makeClient, vboutCommon } from '../common';
export const createSocialMediaMessageAction = createAction({
  auth: vboutAuth,
  name: 'vbout_create_social_media_message',
  displayName: 'Create Social Media Message',
  description: 'Post a message to one of your social media channel.',
  props: {
    message: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
    channel: vboutCommon.socialMediaChannel,
    channelid: vboutCommon.socialMediaProfile,
  },
  async run(context) {
    const client = makeClient(context.auth as string);
    return await client.createSocialMediaPost(context.propsValue);
  },
});
