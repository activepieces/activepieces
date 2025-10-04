import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sevenAuth } from '../index';
import { callSevenApi } from '../common';

export const sendRcsAction = createAction({
  auth: sevenAuth,
  name: 'send-rcs',
  displayName: 'Send RCS',
  description: 'Sends a Rich Communication Services message.',
  props: {
    to: Property.Array({
      displayName: 'To',
      description: 'Recipient number of the RCS.',
      required: true
    }),
    delay: Property.DateTime({
      displayName: 'Delay',
      required: false
    }),
    from: Property.ShortText({
      displayName: 'From',
      required: false
    }),
    text: Property.LongText({
      displayName: 'Message Body',
      description: 'The body of the message to send.',
      required: true
    }),

  },
  async run(context) {
    const { delay, from, text, to } = context.propsValue;

    const response =  await callSevenApi({
      body: {
        delay: delay ? new Date(delay).toISOString().replace('T', ' ').substring(0, 19) : undefined,
        from,
        text,
        to
      },
      method: HttpMethod.POST
    }, 'rcs/messages', context.auth as string);

    return response.body;

  }
});
