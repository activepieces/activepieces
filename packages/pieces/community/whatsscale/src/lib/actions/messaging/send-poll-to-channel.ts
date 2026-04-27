import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { buildRecipientBody, RecipientType } from '../../common/recipients';

export const sendPollToChannelAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_poll_to_channel',
  displayName: 'Send a Poll to a Channel',
  description: 'Send a poll with options to a WhatsApp Channel',
  props: {
    session: whatsscaleProps.session,
    channel: whatsscaleProps.channel,
    question: Property.ShortText({
      displayName: 'Question',
      required: true,
      description: 'The poll question',
    }),
    options: Property.Array({
      displayName: 'Options',
      required: true,
    }),
    multipleAnswers: Property.Checkbox({
      displayName: 'Allow Multiple Answers',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { session, channel, question, options, multipleAnswers } =
      context.propsValue;
    const auth = context.auth.secret_text;

    if (!options || options.length < 2) {
      throw new Error('Poll requires at least 2 options');
    }

    const body = buildRecipientBody(RecipientType.CHANNEL, session, channel);
    const response = await whatsscaleClient(
      auth,
      HttpMethod.POST,
      '/api/sendPoll',
      {
        ...body,
        question,
        options,
        multipleAnswers: multipleAnswers ?? false,
        platform: 'activepieces',
      },
    );

    return response.body;
  },
});
