
export type ChatbotServiceHooks = {
    preSave({ projectId }: { projectId: string }): Promise<void>
}

const emptyChatbotHooks: ChatbotServiceHooks = {
    async preSave() {
        // DO NOTHING
    },
}

let hooks = emptyChatbotHooks

export const chatbotHooks = {
    setHooks(newHooks: ChatbotServiceHooks) {
        hooks = newHooks
    },
    getHooks() {
        return hooks
    },
}