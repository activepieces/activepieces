export type PlatformCopilotChatRequest = {
    message: string
    conversationHistory: { role: 'user' | 'assistant', content: string }[]
}
