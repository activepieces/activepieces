import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import {
  businessAccountIdProp,
  freeFormWindowInfo,
  phoneNumberIdDropdown,
  recipientPhoneProp,
} from '../common/props';

export const sendVideo = createAction({
  auth: kapsoAuth,
  name: 'send_video',
  classification: 'WRITE',
  displayName: 'Send Video',
  description: 'Send a video message via WhatsApp.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a video to a WhatsApp recipient, optionally with a caption. Supply the video either as a public URL or as the media ID of a previously uploaded file (use one or the other). Each call delivers a new message, so it is not idempotent.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'sender',
      display: 'section',
      label: 'Send From',
      icon: 'send',
      props: ['businessAccountId', 'phoneNumberId'],
    },
    {
      key: 'recipient',
      display: 'section',
      label: 'Send To',
      icon: 'user',
      props: ['windowInfo', 'to'],
    },
    {
      key: 'media',
      display: 'section',
      label: 'Video',
      icon: 'paperclip',
      props: ['videoUrl', 'videoId', 'caption'],
    },
  ],
  props: {
    businessAccountId: businessAccountIdProp,
    phoneNumberId: phoneNumberIdDropdown,
    windowInfo: freeFormWindowInfo,
    to: recipientPhoneProp,
    videoUrl: Property.ShortText({
      displayName: 'Video URL',
      description: 'A public link to the video. Leave empty to use a Media ID.',
      placeholder: 'https://example.com/clip.mp4',
      required: false,
    }),
    videoId: Property.ShortText({
      displayName: 'Media ID',
      description: 'ID of a file already uploaded to WhatsApp. Use instead of the URL.',
      required: false,
    }),
    caption: Property.LongText({
      displayName: 'Caption',
      description: 'Text shown under the video.',
      required: false,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, videoUrl, videoId, caption } = context.propsValue;
    if (!videoUrl && !videoId) {
      throw new Error('Enter a Video URL or a Media ID.');
    }
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.sendVideo({
      phoneNumberId,
      to,
      video: {
        link: videoUrl || undefined,
        id: videoId || undefined,
        caption: caption ?? undefined,
      },
    });

    return response;
  },
});
