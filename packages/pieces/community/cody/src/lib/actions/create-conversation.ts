import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../common/auth';
import { CodyClient } from '../common/client';

export const createConversationAction = createAction({
  auth: codyAuth,
  name: 'createConversation',
  displayName: 'Create Conversation',
  description: 'Creates a new conversation with a bot. Use this to start a new chat session with your AI bot.',
  props: {
    name: Property.ShortText({
      displayName: 'Conversation Name',
      description: 'Name for the conversation to help identify it later.',
      required: true,
    }),
    botId: Property.ShortText({
      displayName: 'Bot ID',
      description: 'The unique identifier of the bot to create a conversation with. You can get this from the "Find Bot" action.',
      required: true,
    }),
    documentIds: Property.Array({
      displayName: 'Document IDs (Focus Mode)',
      description: 'Optional list of document IDs to limit the bot\'s knowledge base for this conversation. When provided, focus mode is automatically enabled. Only documents that exist in folders the bot has access to are allowed. Maximum 1000 documents.',
      required: false,
    }),
  },
  async run(context) {
    const { botId, name, documentIds } = context.propsValue;
    
    if (!botId || botId.trim() === '') {
      throw new Error('Bot ID is required and cannot be empty');
    }
    
    if (!name || name.trim() === '') {
      throw new Error('Conversation name is required and cannot be empty');
    }
    
    if (documentIds && documentIds.length > 1000) {
      throw new Error('Maximum 1000 document IDs are allowed for focus mode');
    }
    
    const client = new CodyClient(context.auth);
    
    try {
      const botsResponse = await client.getBots();
      if (!botsResponse.success || !botsResponse.data) {
        throw new Error(`Failed to retrieve bots list: ${botsResponse.error || 'Unknown error'}`);
      }
      
      const bot = botsResponse.data.find(b => b.id === botId);
      if (!bot) {
        throw new Error(`Bot with ID "${botId}" not found. Please verify the bot ID exists.`);
      }
      
      const response = await client.createConversation(
        botId, 
        name, 
        documentIds ? documentIds as string[] : undefined
      );
      
      if (!response.success) {
        throw new Error(`Failed to create conversation: ${response.error}`);
      }
      
      const conversationData = response.data;
      const focusModeEnabled = documentIds && documentIds.length > 0;
      
      return {
        success: true,
        conversation: conversationData,
        message: `Conversation "${name}" created successfully with bot "${bot.name}"${focusModeEnabled ? ' (Focus mode enabled)' : ''}`,
        botInfo: {
          id: bot.id,
          name: bot.name,
          createdAt: bot.created_at,
        },
        focusMode: {
          enabled: focusModeEnabled,
          documentCount: focusModeEnabled ? documentIds.length : 0,
          documentIds: focusModeEnabled ? documentIds : [],
        },
        metadata: {
          conversationId: conversationData?.id,
          botId: botId,
          conversationName: name,
          createdAt: conversationData?.created_at || Date.now(),
          focusModeEnabled: focusModeEnabled,
          readyForMessages: true,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to create conversation: ${errorMessage}`);
    }
  },
});
