import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sevenAuth } from '../index';
import { callSevenApi } from '../common';

export const smsSend = createAction({
  auth: sevenAuth,
  name: 'send_sms',
  description: 'Send a new SMS message',
  displayName: 'Send SMS',
  props: {
    delay: Property.DateTime({
      displayName: 'Delay',
      required: false
    }),
    flash: Property.Checkbox({
      displayName: 'Flash SMS',
      required: false
    }),
    from: Property.ShortText({
      displayName: 'From',
      required: false
    }),
    text: Property.LongText({
      description: 'The body of the message to send',
      displayName: 'Message Body',
      required: true
    }),
    to: Property.Array({
      description: 'The phone numbers to send the message to',
      displayName: 'To',
      required: true
    })
  },
  async run(context) {
    const { delay, flash, from, text, to } = context.propsValue;

    return await callSevenApi({
      body: {
        delay: delay ? new Date(delay).toISOString().replace('T', ' ').substring(0, 19) : undefined,
        flash,
        from,
        text,
        to
      },
      method: HttpMethod.POST
    }, 'sms', context.auth as string);

  }
});
