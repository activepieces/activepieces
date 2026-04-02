import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../../auth';
import { whatsscaleClient } from '../../common/client';
import { whatsscaleProps } from '../../common/props';
import { buildRecipientBody, RecipientType } from '../../common/recipients';

export const sendPollToGroupAction = createAction({
  auth: whatsscaleAuth,
  name: 'whatsscale_send_poll_to_group',
  displayName: 'Send a Poll to a Group',
  description: 'Send a poll with options to a WhatsApp group',
  props: {
    session: whatsscaleProps.session,
    group: whatsscaleProps.group,
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
    const { session, group, question, options, multipleAnswers } =
      context.propsValue;
    const auth = context.auth.secret_text;

    if (!options || options.length < 2) {
      throw new Error('Poll requires at least 2 options');
    }

    const body = buildRecipientBody(RecipientType.GROUP, session, group);
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
