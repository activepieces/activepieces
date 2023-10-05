import { ChatMessageHistory, ConversationSummaryMemory } from 'langchain/memory'
import { BaseChatMessageHistory, SystemMessage } from 'langchain/schema'
import { BaseLanguageModel } from 'langchain/dist/base_language'
import { OpenAI } from 'langchain/llms/openai'
import { BufferWindowMemory } from 'langchain/memory'
import { PromptTemplate } from 'langchain/prompts'
import { ConversationChain } from 'langchain/chains'
import { APChatMessage } from '@activepieces/shared'
export type APLLM = {
    chat: ({ input, temperature, maxTokens }: AskChat) => Promise<string>
}
export const llm = (openAIApiKey: string, modelName: string) => {
    return {
        async chat({ input, temperature, maxTokens, history, settingsPrompt }: AskChat) {
            const model = new OpenAI({
                modelName,
                openAIApiKey,
                temperature: temperature || 0.7,
                maxTokens,
            })
            
            const template = `
${settingsPrompt}
The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.
Current conversation:
System: {chat_summary}
{recent_chat_history}
Human: {human_input}
AI:`
            const prompt = new PromptTemplate({
                inputVariables: ['chat_summary', 'human_input', 'recent_chat_history'],
                template,
            })
            const k = 10
            const summary = history.length > k ? await summarizeMessages(model, history) : ''
            const historyThread = await createChatMessageHistory(history)
            const memory = new BufferWindowMemory({
                chatHistory: historyThread,
                memoryKey: 'recent_chat_history',
                inputKey: 'human_input',
                k,
                returnMessages: false,
            })
            const chain = new ConversationChain({
                memory,
                verbose: true,
                llm: model,
                prompt,
            })
            const response = await chain.predict({
                chat_summary: summary,
                human_input: input, 
            })
            return response
        },
    }
}

export type AskChat = {
    input: string
    history: APChatMessage[]
    settingsPrompt: string
    temperature?: number
    maxTokens?: number
}

export const summarizeMessages = async (model: BaseLanguageModel, messages: APChatMessage[]): Promise<string> => {
    const summary_memory = new ConversationSummaryMemory({
        llm: model, 
        chatHistory: await createChatMessageHistory(messages),  
    })
  
    const summary = await summary_memory.predictNewSummary(await summary_memory.chatHistory.getMessages(), '')
    return summary
} 

export const createChatMessageHistory = async (messages: APChatMessage[]): Promise<BaseChatMessageHistory> => {
    const history = new ChatMessageHistory()
    for (const message of messages) {
        switch (message.role) {
            case 'user': {
                await history.addUserMessage(message.text)
                break
            }
            case 'bot': {
                await   history.addAIChatMessage(message.text)
                break
            }
            default: {
                await  history.addMessage(new SystemMessage(message.text))
                break
            }
        }
    }
    return history
}