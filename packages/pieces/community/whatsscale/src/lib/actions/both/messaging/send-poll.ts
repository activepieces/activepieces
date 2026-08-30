import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { resolveSendResult } from '../../../common/messaging';
import { whatsscaleProps } from '../../../common/props';
import { ChatType } from '../../../common/types';
import { buildRecipientBody, RecipientType } from '../../../common/recipients';

export const sendPollManualAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_poll_manual',
  classification: 'WRITE',
  displayName: 'Send a Poll (By ID)',
  description: 'Send an interactive poll to a contact, group, channel, or CRM contact by ID rather than picking from a list.',
  audience: 'both',
  aiMetadata: { description: 'Sends an interactive poll (2-12 options) to a recipient identified directly by ID rather than a builder dropdown. Set multipleAnswers to allow more than one option to be selected. Not idempotent: each call sends another poll.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    chatType: Property.StaticDropdown({
      displayName: 'Recipient Type',
      description: 'Who this poll is being sent to.',
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
    question: Property.ShortText({
      displayName: 'Question',
      description: 'The poll question.',
      required: true,
    }),
    options: Property.Array({
      displayName: 'Options',
      description: '2 to 12 unique answer options.',
      required: true,
    }),
    multipleAnswers: Property.Checkbox({
      displayName: 'Allow Multiple Answers',
      required: false,
      defaultValue: false,
    }),
  },
  propertyGroups: [
    { key: 'destination', display: 'section' as const, label: 'Destination', props: ['session', 'chatType', 'recipient'] },
    { key: 'content', display: 'section' as const, label: 'Poll', props: ['question', 'options', 'multipleAnswers'] },
  ],
  async run(context) {
    const { session, chatType, recipient, question, options, multipleAnswers } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const recipientBody = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      recipient,
      chatType,
    );

    const body: Record<string, unknown> = {
      ...recipientBody,
      question,
      options,
      multipleAnswers: multipleAnswers ?? false,
    };

    const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendPoll', body);
    return await resolveSendResult({ apiKey: apiKey, body: response.body });
  },
});
