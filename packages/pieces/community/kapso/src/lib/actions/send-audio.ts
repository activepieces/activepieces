import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import {
  businessAccountIdProp,
  freeFormWindowInfo,
  phoneNumberIdDropdown,
  recipientPhoneProp,
} from '../common/props';

export const sendAudio = createAction({
  auth: kapsoAuth,
  name: 'send_audio',
  classification: 'WRITE',
  displayName: 'Send Audio',
  description: 'Send an audio message via WhatsApp.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends an audio file to a WhatsApp recipient. Supply the audio either as a public URL or as the media ID of a previously uploaded file (use one or the other). Each call delivers a new message, so it is not idempotent.',
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
      label: 'Audio',
      icon: 'paperclip',
      props: ['audioUrl', 'audioId'],
    },
  ],
  props: {
    businessAccountId: businessAccountIdProp,
    phoneNumberId: phoneNumberIdDropdown,
    windowInfo: freeFormWindowInfo,
    to: recipientPhoneProp,
    audioUrl: Property.ShortText({
      displayName: 'Audio URL',
      description: 'A public link to the audio file. Leave empty to use a Media ID.',
      placeholder: 'https://example.com/voice.mp3',
      required: false,
    }),
    audioId: Property.ShortText({
      displayName: 'Media ID',
      description: 'ID of a file already uploaded to WhatsApp. Use instead of the URL.',
      required: false,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, audioUrl, audioId } = context.propsValue;
    if (!audioUrl && !audioId) {
      throw new Error('Enter an Audio URL or a Media ID.');
    }
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.sendAudio({
      phoneNumberId,
      to,
      audio: {
        link: audioUrl || undefined,
        id: audioId || undefined,
      },
    });

    return response;
  },
});
