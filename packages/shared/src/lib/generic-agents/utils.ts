import { AssistantConversationMessage, ConversationMessage, UserConversationMessage } from "./message"
import { AgentStreamingUpdateProgressData, ExecuteAgentData } from "./dto"

export const genericAgentUtils = {
  streamChunk(session: ExecuteAgentData, chunk: AgentStreamingUpdateProgressData): ExecuteAgentData {
      const newConvo: ConversationMessage[] = [...(session.conversation ?? [])]
      const lastMessageIsAssistant = session.conversation && session.conversation.length > 0 && newConvo[newConvo.length - 1].role === 'assistant'
      if (!lastMessageIsAssistant) {
          newConvo.push({
              role: 'assistant',
              parts: [],
          })
      }
      const lastAssistantMessage = newConvo[newConvo.length - 1] as AssistantConversationMessage
      
      // For text parts, merge with the last text part (streaming behavior)
      // For tool-call, find existing part by toolCallId or add new
      if (chunk.part.type === 'text') {
          const lastPart = lastAssistantMessage.parts[lastAssistantMessage.parts.length - 1]
          if (lastPart && lastPart.type === 'text') {
              lastAssistantMessage.parts[lastAssistantMessage.parts.length - 1] = {
                  ...lastPart,
                  ...chunk.part,
              }
          } else {
              
              lastAssistantMessage.parts.push(chunk.part)
          }
      } else if (chunk.part.type === 'tool-call') {
          const toolCallId = chunk.part.toolCallId
          const existingIndex = lastAssistantMessage.parts.findIndex(
              (part) => 
                  part.type === 'tool-call' && 
                  part.toolCallId === toolCallId
          )
          if (existingIndex !== -1) {
              lastAssistantMessage.parts[existingIndex] = {
                  ...lastAssistantMessage.parts[existingIndex],
                  ...chunk.part,
              }
          } else {
              lastAssistantMessage.parts.push(chunk.part)
          }
      } else {
          lastAssistantMessage.parts.push(chunk.part)
      }
      
      return {
          ...session,
          conversation: newConvo,
      }
  },
  addEmptyAssistantMessage(session: ExecuteAgentData): ExecuteAgentData {
    return {
        ...session,
        conversation: [...(session.conversation ?? []), {
            role: 'assistant',
            parts: [],
        }],
    }
},
addUserMessage(
    session: ExecuteAgentData, 
    message: string, 
    files?: { name: string; type: string; url: string }[]
): ExecuteAgentData {
    const content: UserConversationMessage['content'] = []
    
    // Add text message if present
    if (message.trim()) {
        content.push({
            type: 'text',
            message,
        })
    }
    
    // Add file attachments
    if (files && files.length > 0) {
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                content.push({
                    type: 'image',
                    image: file.url,
                    name: file.name,
                })
            } else {
                content.push({
                    type: 'file',
                    file: file.url,
                    name: file.name,
                    mimeType: file.type,
                })
            }
        }
    }
    
    return {
        ...session,
        conversation: [...(session.conversation ?? []), {
            role: 'user',
            content,
        }],
    }
},

}