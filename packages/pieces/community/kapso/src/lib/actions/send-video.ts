import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import { phoneNumberIdDropdown } from '../common/props';

export const sendVideo = createAction({
  auth: kapsoAuth,
  name: 'send_video',
  displayName: 'Send Video',
  description: 'Send a video message via WhatsApp.',
  props: {
    phoneNumberId: phoneNumberIdDropdown,
    to: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description:
        'The recipient\'s phone number in international format (e.g. 15551234567).',
      required: true,
    }),
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      description: 'Public URL of the video to send.',
      required: false,
    }),
    videoId: Property.ShortText({
      displayName: 'Video Media ID',
      description: 'Media ID of a previously uploaded video. Use either URL or Media ID.',
      required: false,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'Optional caption for the video.',
      required: false,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, videoUrl, videoId, caption } = context.propsValue;
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.sendVideo({
      phoneNumberId,
      to,
      video: {
        link: videoUrl ?? undefined,
        id: videoId ?? undefined,
        caption: caption ?? undefined,
      },
    });

    return response;
  },
});
