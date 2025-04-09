import { Property, createAction } from '@activepieces/pieces-framework'
import { dustAuth } from '../..'
import { getConversationContent, timeoutProp } from '../common'

export const getConversation = createAction({
  name: 'getConversation',
  displayName: 'Get existing conversation',
  description: 'Get an existing conversation',
  auth: dustAuth,
  props: {
    conversationSid: Property.ShortText({
      displayName: 'Conversation sID',
      required: true,
    }),
    timeout: timeoutProp,
  },
  async run({ auth, propsValue }) {
    return await getConversationContent(propsValue.conversationSid, propsValue.timeout, auth)
  },
})
