import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { resolveSendResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { ChatType } from '../../../common/types';
import { buildRecipientBody, RecipientType } from '../../../common/recipients';
import { prepareMediaFile } from '../../../common/prepare-file';

export const sendAudioManualAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_audio_manual',
  classification: 'WRITE',
  displayName: 'Send an Audio Message (By ID)',
  description: 'Send an audio file to a contact, group, channel, or CRM contact by ID rather than picking from a list.',
  audience: 'both',
  aiMetadata: { description: 'Sends an audio file to a recipient identified directly by ID rather than a builder dropdown. Sends as a native WhatsApp voice note by default; set voice to false to deliver it as a regular file attachment with an optional caption instead. Takes either a directly downloadable audio URL or a file from a previous step. Not idempotent: each call delivers another audio message.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    chatType: Property.StaticDropdown({
      displayName: 'Recipient Type',
      description: 'Who this audio message is being sent to.',
      required: true,
      display: 'cards',
      options: {
        options: [
          { label: 'Contact', value: ChatType.CONTACT, description: 'A phone number with country code', icon: 'user' },
          { label: 'Group', value: ChatType.GROUP, description: 'A WhatsApp group by ID', icon: 'users' },
          { label: 'Channel', value: ChatType.CHANNEL, description: 'A WhatsApp Channel by ID', icon: 'send' },
          { label: 'CRM Contact', value: ChatType.CRM_CONTACT, description: 'A WhatsScale CRM contact by ID', icon: 'tag' },
        ],
      },
    }),
    recipient: Property.ShortText({
      displayName: 'Recipient ID',
      description:
        'Contact: the phone number in international format, digits only (e.g. 31649931832 — no +, spaces or dashes). Group/Channel: the bare ID, no @ suffix needed. CRM Contact: the CRM contact ID. A full chat ID is also accepted and passed through unchanged, so the Chat ID returned by Check WhatsApp Number (31649931832@c.us) or by a previous send (31649931832@s.whatsapp.net) can be fed straight in.',
      required: true,
    }),
    audioUrl: Property.File({
      displayName: 'Audio',
      description: 'A direct URL to the audio, or a file from a previous step.',
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
      description: 'Optional filename. Auto-detected from the file if not provided.',
      required: false,
    }),
    caption: Property.ShortText({
      displayName: 'Caption',
      description: 'Optional caption (max 1024 characters). Only applies when Send as Voice Note is off.',
      required: false,
    }),
  },
  propertyGroups: [
    { key: 'destination', display: 'section' as const, label: 'Destination', props: ['session', 'chatType', 'recipient'] },
    { key: 'content', display: 'section' as const, label: 'Audio', props: ['audioUrl', 'voice', 'filename', 'caption'] },
  ],
  async run(context) {
    const { session, chatType, recipient, audioUrl, voice, filename, caption } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const preparedUrl = await prepareMediaFile({ apiKey, file: audioUrl, files: context.files, mediaType: 'audio' });

    const recipientBody = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      recipient,
      chatType,
    );

    const body: Record<string, unknown> = { ...recipientBody, file: preparedUrl };
    if (voice !== undefined) body['voice'] = voice;
    if (filename) body['filename'] = filename;
    if (voice === false && caption) body['caption'] = caption;

    const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendAudio', body);
    return await resolveSendResult({ apiKey: apiKey, body: response.body });
  },
});
