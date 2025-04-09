import { HttpMethod } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { callSevenApi } from '../common'
import { sevenAuth } from '../index'

export const sendSmsAction = createAction({
  auth: sevenAuth,
  name: 'send-sms',
  displayName: 'Send SMS',
  description: 'Sends an SMS to one or more recipients.',
  props: {
    to: Property.Array({
      displayName: 'To',
      description: 'Recipient numbers of the SMS.',
      required: true,
    }),
    delay: Property.DateTime({
      displayName: 'Delay',
      required: false,
    }),
    flash: Property.Checkbox({
      displayName: 'Flash SMS ?',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'From',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Message Body',
      description: 'The body of the message to send.',
      required: true,
    }),
  },
  async run(context) {
    const { delay, flash, from, text, to } = context.propsValue

    const response = await callSevenApi(
      {
        body: {
          delay: delay ? new Date(delay).toISOString().replace('T', ' ').substring(0, 19) : undefined,
          flash,
          from,
          text,
          to,
        },
        method: HttpMethod.POST,
      },
      'sms',
      context.auth as string,
    )

    return response.body
  },
})
