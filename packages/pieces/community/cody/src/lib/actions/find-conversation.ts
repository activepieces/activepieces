import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../common/auth';
import { CodyClient } from '../common/client';

export const findConversationAction = createAction({
  auth: codyAuth,
  name: 'findConversation',
  displayName: 'Find Conversation',
  description: 'Finds a conversation based on bot ID or conversation name.',
  props: {
    name: Property.ShortText({
      displayName: 'Conversation Name',
      description: 'The name (or partial name) of the conversation to search for. Uses server-side filtering for better performance.',
      required: false,
    }),
    botId: Property.ShortText({
      displayName: 'Bot ID',
      description: 'Optional bot ID to filter conversations by specific bot. Leave empty to search all conversations.',
      required: false,
    }),
    exactMatch: Property.Checkbox({
      displayName: 'Exact Name Match',
      description: 'Enable exact name matching. When disabled, partial matches are allowed using server-side filtering.',
      required: false,
      defaultValue: false,
    }),
    includeDocuments: Property.Checkbox({
      displayName: 'Include Document IDs',
      description: 'Include document IDs that the conversation is focused on (Focus Mode documents).',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { name, botId, exactMatch, includeDocuments } = context.propsValue;
    
    if (!name && !botId) {
      throw new Error('At least one search criteria (conversation name or bot ID) must be provided');
    }
    
    const client = new CodyClient(context.auth);
    
    try {
      const includesParam = includeDocuments ? 'document_ids' : undefined;
      
      let response;
      let foundConversation = null;
      let searchMethod = '';
      
      if (exactMatch && name) {
        searchMethod = 'client-side-exact';
        response = await client.getConversations(botId, undefined, includesParam);
        if (response.success && response.data) {
          foundConversation = response.data.find(conv => 
            conv.name?.toLowerCase() === name.toLowerCase()
          );
        }
      } else if (name) {
        searchMethod = 'server-side-keyword';
        response = await client.getConversations(botId, name, includesParam);
        if (response.success && response.data) {
          foundConversation = response.data.length > 0 ? response.data[0] : null;
          if (!foundConversation) {
            const fallbackResponse = await client.getConversations(botId, undefined, includesParam);
            if (fallbackResponse.success && fallbackResponse.data) {
              foundConversation = fallbackResponse.data.find(conv => 
                conv.name?.toLowerCase().includes(name.toLowerCase())
              );
            }
          }
        }
      } else {
        searchMethod = 'bot-id-only';
        response = await client.getConversations(botId, undefined, includesParam);
        if (response.success && response.data) {
          foundConversation = response.data.length > 0 ? response.data[0] : null;
        }
      }
      
      if (!response || !response.success) {
        throw new Error(`Failed to retrieve conversations: ${response?.error || 'Unknown error'}`);
      }
      
      const conversations = response.data || [];
      
      if (!foundConversation) {
        return {
          success: true,
          conversation: null,
          found: false,
          message: `No conversation found with the specified criteria`,
          searchCriteria: {
            name: name || null,
            botId: botId || null,
            exactMatch,
            includeDocuments,
            searchMethod,
            totalConversationsSearched: conversations.length,
          },
          pagination: response.meta?.pagination || null,
        };
      }
      
      return {
        success: true,
        conversation: foundConversation,
        found: true,
        message: `Conversation "${foundConversation.name}" found successfully`,
        searchCriteria: {
          name: name || null,
          botId: botId || null,
          exactMatch,
          includeDocuments,
          searchMethod,
          totalConversationsSearched: conversations.length,
        },
        metadata: {
          conversationId: foundConversation.id,
          conversationName: foundConversation.name,
          botId: foundConversation.bot_id,
          createdAt: foundConversation.created_at,
        },
        pagination: response.meta?.pagination || null,
      };
    } catch (error) {
      throw new Error(
        `Failed to find conversation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});
