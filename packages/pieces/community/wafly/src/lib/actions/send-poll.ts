import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { waflyAuth, waflyApiCall, normalizePhone } from '../common';

export const sendPoll = createAction({
  auth: waflyAuth,
  name: 'send_poll',
  displayName: 'Send Poll',
  description: 'Send a WhatsApp poll with two or more options.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends a WhatsApp poll from a connected Wafly instance, with a question and a list of options, optionally allowing multiple selections. Not idempotent: each call posts a new poll.',
    idempotent: false,
  },
  props: {
    phone: Property.ShortText({
      displayName: 'To',
      description:
        'Phone number in international format (e.g. 5511999999999) or a group ID.',
      required: true,
    }),
    message: Property.ShortText({
      displayName: 'Question',
      required: true,
    }),
    options: Property.Array({
      displayName: 'Options',
      description: 'At least two.',
      required: true,
    }),
    maxOptions: Property.Number({
      displayName: 'Max Selectable Options',
      description: 'How many options a person may pick. Defaults to 1.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const { phone, message, options, maxOptions } = context.propsValue;

    const poll = (options as string[])
      .map((option) => String(option).trim())
      .filter((option) => option.length > 0)
      .map((optionName) => ({ optionName }));

    if (poll.length < 2) {
      throw new Error('A poll needs at least two non-empty options.');
    }

    return await waflyApiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: '/send-poll',
      body: {
        phone: normalizePhone(phone),
        message,
        poll,
        pollMaxOptions: maxOptions ?? 1,
      },
    });
  },
});
