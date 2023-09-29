import { ActivepiecesError, ErrorCode, SecretTextConnectionValue } from '@activepieces/shared'
import { customBot } from './custom-bot'
import { embeddings } from '../embedings'
import { llm } from '../framework/llm'

const chatbots = [customBot]

export const runBot = async ({
    botId,
    type,
    input,
    auth,
    prompt,
}: {
    botId: string
    type: string
    auth: SecretTextConnectionValue
    input: string
    prompt: string
}): Promise<string> => {
    const bot = chatbots.find((b) => b.name === type)
    if (!bot) {
        throw new Error(`Bot ${type} not found`)
    }
    try {
        const embeddingsTool = embeddings.create({ botId, openAIApiKey: auth.secret_text })
        return bot.run({
            input,
            llm: llm(auth.secret_text, 'gpt-3.5-turbo'),
            embeddings: embeddingsTool,
            settings: {
                prompt,
            },
        })
    }
    catch (error) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: JSON.stringify(error),
            },
        })
    }
}
