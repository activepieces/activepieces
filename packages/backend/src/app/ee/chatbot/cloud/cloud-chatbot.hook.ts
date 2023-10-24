import { ChatbotServiceHooks } from '../../../chatbot/chatbot.hooks'
import { botsLimits } from '../../billing/usage/limits/bots-limits'


export const cloudChatbotHooks: ChatbotServiceHooks = {
    async preSave({ projectId }) {
        await botsLimits.limitBots({ projectId })
    },
}

