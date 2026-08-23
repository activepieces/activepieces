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
  aiMetadata: { description: 'Sends a text message to a recipient identified directly by ID rather than a builder dropdown. Set recipient_type to contact (phone number with country code), group or channel (bare ID, no @ suffix needed), or crm_contact (WhatsScale CRM contact ID). Not idempotent: each call sends another message.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    chatType: Property.StaticDropdown({
      displayName: 'Recipient Type',
      required: true,
      options: {
        disabled: false,
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
      required: true,
      description:
        'Contact: phone number with country code (e.g. +31649931832). Group/Channel: the bare ID, no @ suffix needed. CRM Contact: the CRM contact ID.',
    }),
    text: Property.LongText({
      displayName: 'Message',
      required: true,
      description: 'The text message to send',
    }),
  },
  async run(context) {
    const { session, chatType, recipient, text } = context.propsValue;
    const auth = context.auth.secret_text;

    const body = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      recipient,
      chatType as ChatType,
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
