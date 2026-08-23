import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { ConductorSendMessageResult, flattenSendMessageResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { ChatType } from '../../../common/types';
import { buildRecipientBody, RecipientType } from '../../../common/recipients';
import { prepareFile } from '../../../common/prepare-file';

export const sendAudioManualAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_audio_manual',
  classification: 'WRITE',
  displayName: 'Send an Audio Message (By ID)',
  description: 'Send an audio file to a contact, group, channel, or CRM contact by ID rather than picking from a list.',
  audience: 'both',
  aiMetadata: { description: 'Sends an audio file to a recipient identified directly by ID rather than a builder dropdown. Sends as a native WhatsApp voice note by default; set voice to false to deliver it as a regular file attachment with an optional caption instead. Requires a directly downloadable audio URL. Not idempotent: each call delivers another audio message.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    chatType: Property.StaticDropdown({
      displayName: 'Recipient Type',
      description: 'Who this audio message is being sent to.',
      required: true,
      options: {
        options: [
          { label: 'Contact (Phone Number)', value: ChatType.CONTACT },
          { label: 'Group', value: ChatType.GROUP },
          { label: 'Channel', value: ChatType.CHANNEL },
          { label: 'CRM Contact', value: ChatType.CRM_CONTACT },
        ],
      },
    }),
    recipient: Property.ShortText({
      displayName: 'Recipient ID',
      description:
        'Contact: phone number with country code. Group/Channel: the bare ID, no @ suffix needed. CRM Contact: the CRM contact ID.',
      required: true,
    }),
    audioUrl: Property.ShortText({
      displayName: 'Audio URL',
      description: 'Direct URL to the audio file.',
      required: true,
    }),
    voice: Property.Checkbox({
      displayName: 'Send as Voice Note',
      description: 'On sends a native WhatsApp voice note. Off sends a regular file attachment and allows a caption.',
      required: false,
      defaultValue: true,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'Optional filename. Auto-detected from URL if not provided.',
      required: false,
    }),
    caption: Property.ShortText({
      displayName: 'Caption',
      description: 'Optional caption (max 1024 characters). Only applies when Send as Voice Note is off.',
      required: false,
    }),
  },
  async run(context) {
    const { session, chatType, recipient, audioUrl, voice, filename, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareFile(apiKey, audioUrl, 'audio');

    const recipientBody = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      recipient,
      chatType as ChatType,
    );

    const body: Record<string, unknown> = { ...recipientBody, file: preparedUrl };
    if (voice !== undefined) body['voice'] = voice;
    if (filename) body['filename'] = filename;
    if (voice === false && caption) body['caption'] = caption;

    const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendAudio', body);
    return flattenSendMessageResult(response.body as ConductorSendMessageResult);
  },
});
