import { Property, createAction } from '@activepieces/pieces-framework'
import { mailerooAuth } from '../..'
import { checkEmail } from '../common/send-utils'

export const verifyEmail = createAction({
  auth: mailerooAuth,
  name: 'verifyEmail',
  displayName: 'Verify Email',
  description: 'Verifies an email address.',
  props: {
    content: Property.ShortText({
      displayName: 'Email',
      description: 'Email to verify',
      required: true,
    }),
  },
  async run(context) {
    const result = await checkEmail(context.propsValue.content, context.auth.apiKey)

    return result.body
  },
})
