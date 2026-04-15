export type PlatformCopilotChatRequest = {
    message: string
    conversationHistory: { role: 'user' | 'assistant', content: string }[]
    modelId?: string
    provider?: string
}

export type PlatformCopilotChatResponse = {
    response: string
    sources: { title: string, url: string }[]
}
