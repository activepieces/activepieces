import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../common/auth';
import { CodyClient } from '../common/client';

export const sendMessageAction = createAction({
  auth: codyAuth,
  name: 'sendMessage',
  displayName: 'Send Message',
  description: 'Send your message and receive the AI-generated response.',
  props: {
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'The ID of the conversation to send the message to. You can get this from the "Create Conversation" or "Find Conversation" actions.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Message Content',
      description: 'The message content to send to the AI bot. Maximum 2000 characters as per API specification.',
      required: true,
    }),
    waitForResponse: Property.Checkbox({
      displayName: 'Wait for AI Response',
      description: 'Whether to wait for and return the AI-generated response. When enabled, the action will poll for the bot\'s reply.',
      required: false,
      defaultValue: true,
    }),
    maxWaitTime: Property.Number({
      displayName: 'Max Wait Time (seconds)',
      description: 'Maximum time to wait for AI response in seconds. Default is 30 seconds.',
      required: false,
      defaultValue: 30,
    }),
    includeSources: Property.Checkbox({
      displayName: 'Include Sources',
      description: 'Include document sources that the AI used to generate the response. This provides transparency about which knowledge base documents were referenced.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { conversationId, content, waitForResponse, maxWaitTime, includeSources } = context.propsValue;
    
    if (!conversationId || conversationId.trim() === '') {
      throw new Error('Conversation ID is required and cannot be empty');
    }
    
    if (!content || content.trim() === '') {
      throw new Error('Message content is required and cannot be empty');
    }
    
    if (content.length > 2000) {
      throw new Error(`Message content exceeds the maximum limit of 2000 characters (current: ${content.length} characters)`);
    }
    
    const client = new CodyClient(context.auth);
    
    try {
      const userMessageResponse = await client.sendMessage(conversationId, content);
      
      if (!userMessageResponse.success) {
        const errorMsg = userMessageResponse.error || 'Unknown error';
        if (errorMsg.includes('message limit') || errorMsg.includes('402')) {
          throw new Error('You have reached the message limit for the last 30 days. Please wait or upgrade your plan.');
        }
        if (errorMsg.includes('500') || errorMsg.includes('generation fails')) {
          throw new Error('AI response generation failed due to service overload or network issues. Please try again.');
        }
        throw new Error(`Failed to send message: ${errorMsg}`);
      }
      
      const userMessage = userMessageResponse.data;
      
      if (userMessage?.flagged) {
        throw new Error('Message was flagged and violates OpenAI usage policy');
      }
      
      const result: any = {
        success: true,
        userMessage: userMessage,
        message: 'Message sent successfully',
        metadata: {
          conversationId,
          messageId: userMessage?.id,
          messageLength: content.length,
          sentAt: userMessage?.created_at || Date.now(),
          flagged: userMessage?.flagged || false,
          includeSources: includeSources || false,
        },
      };
      
      if (waitForResponse) {
        const maxWaitMs = (maxWaitTime || 30) * 1000;
        const startTime = Date.now();
        const pollInterval = 2000;
        
        while (Date.now() - startTime < maxWaitMs) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          
          try {
            const includesParam = includeSources ? 'sources' : undefined;
            const messagesResponse = await client.getMessages(conversationId, includesParam);
            if (messagesResponse.success && messagesResponse.data) {
              const aiMessage = messagesResponse.data
                .filter(msg => msg.machine && msg.created_at > (userMessage?.created_at || 0))
                .sort((a, b) => b.created_at - a.created_at)[0];
              
              if (aiMessage) {
                result.aiResponse = {
                  id: aiMessage.id,
                  content: aiMessage.content,
                  failed_responding: aiMessage.failed_responding,
                  flagged: aiMessage.flagged,
                  receivedAt: aiMessage.created_at,
                  ...(aiMessage.sources && { sources: aiMessage.sources }),
                };
                result.message = 'Message sent and AI response received';
                
                if (aiMessage.failed_responding) {
                  result.warning = 'AI failed to generate a proper response';
                }
                
                if (aiMessage.flagged) {
                  result.warning = 'AI response was flagged for policy violations';
                }
                
                if (includeSources && aiMessage.sources) {
                  result.message += ' (with sources)';
                }
                
                break;
              }
            }
          } catch (pollError) {
            console.warn('Error polling for AI response:', pollError);
          }
        }
        
        if (!result.aiResponse) {
          result.warning = `No AI response received within ${maxWaitTime} seconds`;
          result.message = 'Message sent but AI response timed out';
        }
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to send message: ${errorMessage}`);
    }
  },
});
