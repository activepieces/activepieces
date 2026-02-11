import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import { phoneNumberIdDropdown } from '../common/props';

export const sendAudio = createAction({
  auth: kapsoAuth,
  name: 'send_audio',
  displayName: 'Send Audio',
  description: 'Send an audio message via WhatsApp.',
  props: {
    phoneNumberId: phoneNumberIdDropdown,
    to: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description:
        'The recipient\'s phone number in international format (e.g. 15551234567).',
      required: true,
    }),
    audioUrl: Property.ShortText({
      displayName: 'Audio URL',
      description: 'Public URL of the audio file to send.',
      required: false,
    }),
    audioId: Property.ShortText({
      displayName: 'Audio Media ID',
      description: 'Media ID of a previously uploaded audio. Use either URL or Media ID.',
      required: false,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, audioUrl, audioId } = context.propsValue;
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.sendAudio({
      phoneNumberId,
      to,
      audio: {
        link: audioUrl ?? undefined,
        id: audioId ?? undefined,
      },
    });

    return response;
  },
});
