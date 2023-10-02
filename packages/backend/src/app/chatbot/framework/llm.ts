import { OpenAI } from 'langchain/llms/openai'

export type APLLM = {
    chat: ({ input, temperature, maxTokens }: AskChat) => Promise<string>
}

export const llm = (openAIApiKey: string, modelName: string) => {
    return {
        async chat({ input, temperature, maxTokens }: AskChat) {
            const model = new OpenAI({
                modelName,
                openAIApiKey,
                temperature: temperature || 0.7,
                maxTokens,
            })
            const response = await model.call(input)
            return response
        },
    }
}

type AskChat = {
    input: string
    history: {
        text: string
        role: 'bot' | 'user'
    }[]
    temperature?: number
    maxTokens?: number
}
