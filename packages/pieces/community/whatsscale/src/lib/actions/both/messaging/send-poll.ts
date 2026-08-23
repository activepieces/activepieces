import { createAction, Property } from '@activepieces/pieces-framework';
import { sendMessageResultOutputSchema } from '../../../output-schemas';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../../auth';
import { whatsscaleClient } from '../../../common/client';
import { ConductorSendMessageResult, flattenSendMessageResult } from '../../../common/messaging';
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
  aiMetadata: { description: 'Sends an interactive poll (2-12 options) to a recipient identified directly by ID rather than a builder dropdown. Set multiple_answers to allow more than one option to be selected. Not idempotent: each call sends another poll.', idempotent: false },
  outputSchema: sendMessageResultOutputSchema,
  props: {
    session: whatsscaleProps.session,
    chatType: Property.StaticDropdown({
      displayName: 'Recipient Type',
      description: 'Who this poll is being sent to.',
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
  async run(context) {
    const { session, chatType, recipient, question, options, multipleAnswers } = context.propsValue;
    const apiKey = context.auth.secret_text;

    const recipientBody = buildRecipientBody(
      RecipientType.MANUAL,
      session,
      recipient,
      chatType as ChatType,
    );

    const body: Record<string, unknown> = {
      ...recipientBody,
      question,
      options: options as string[],
      multipleAnswers: multipleAnswers ?? false,
    };

    const response = await whatsscaleClient(apiKey, HttpMethod.POST, '/api/sendPoll', body);
    return flattenSendMessageResult(response.body as ConductorSendMessageResult);
  },
});
