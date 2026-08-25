import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { ConductorSendMessageResult, flattenSendMessageResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { buildRecipientBody, RecipientType } from '../../../common/recipients';
import { ChatType } from '../../../common/types';

export const sendTextManualAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_text_manual',
  classification: 'WRITE',
  displayName: 'Send a Text Message (By ID)',
  description: 'Send a text message to a contact, group, channel, or CRM contact by ID rather than picking from a list.',
  audience: 'ai',
  aiMetadata: { description: 'Sends a text message to a recipient identified directly by ID rather than a builder dropdown. Set chatType to contact (phone number with country code), group or channel (bare ID, no @ suffix needed), or crm_contact (WhatsScale CRM contact ID). Not idempotent: each call sends another message.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    chatType: Property.StaticDropdown({
      displayName: 'Recipient Type',
      description: 'Who this message is being sent to.',
      required: true,
      display: 'cards',
      options: {
        disabled: false,
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
      required: true,
      description:
        'Contact: the phone number in international format, digits only (e.g. 31649931832 — no +, spaces or dashes). Group/Channel: the bare ID, no @ suffix needed. CRM Contact: the CRM contact ID. A full chat ID is also accepted and passed through unchanged, so the Chat ID returned by Check WhatsApp Number (31649931832@c.us) or by a previous send (31649931832@s.whatsapp.net) can be fed straight in.',
    }),
    text: Property.LongText({
      displayName: 'Message',
      required: true,
      description: 'The text message to send',
    }),
  },
  propertyGroups: [
    { key: 'destination', display: 'section' as const, label: 'Destination', props: ['session', 'chatType', 'recipient'] },
    { key: 'content', display: 'section' as const, label: 'Message', props: ['text'] },
  ],
  async run(context) {
    const { session, chatType, recipient, text } = context.propsValue;
    const auth = context.auth.secret_text;

    const body = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      recipient,
      chatType,
    );
    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      '/api/sendText',
      { ...body, text },
    );

    return flattenSendMessageResult(response.body as ConductorSendMessageResult);
  },
});
