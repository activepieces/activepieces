import { createAction } from '@activepieces/pieces-framework'
import { intercomAuth } from '../../index'
import { intercomClient } from '../common'
import { conversationIdProp } from '../common/props'

export const getConversationAction = createAction({
  auth: intercomAuth,
  name: 'get-conversation',
  displayName: 'Retrieve a Conversation',
  description: 'Retrieves a specific conversation by ID.',
  props: {
    conversationId: conversationIdProp('Conversation ID', true),
  },
  async run(context) {
    const { conversationId } = context.propsValue
    const client = intercomClient(context.auth)

    if (!conversationId) {
      throw new Error('Conversation ID is required')
    }

    const response = await client.conversations.find({
      conversation_id: conversationId,
    })

    return response
  },
})
