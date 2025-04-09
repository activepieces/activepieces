import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { birdAuth } from '../auth'

export const sendSMSAction = createAction({
  auth: birdAuth,
  name: 'send-sms',
  displayName: 'Send SMS',
  description: 'Sends an SMS message via Bird Channels API.',
  props: {
    recipient: Property.ShortText({
      displayName: 'Recipient',
      description: 'The phone number to send the message to (with country code)',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'The body of the SMS message',
      required: true,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Your own identifier for the message (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { recipient, message, reference } = context.propsValue
    const auth = context.auth as { apiKey: string; workspaceId: string; channelId: string }

    // Format request for Bird Channels API
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.bird.com/workspaces/${auth.workspaceId}/channels/${auth.channelId}/messages`,
      headers: {
        Authorization: `Bearer ${auth.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        receiver: {
          contacts: [
            {
              identifierValue: recipient,
            },
          ],
        },
        body: {
          type: 'text',
          text: {
            text: message,
          },
        },
        ...(reference && { reference }),
      },
    }

    return await httpClient.sendRequest(request)
  },
})
