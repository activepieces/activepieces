
import { createChatbot } from '../framework/chatbot'


export const customBot = createChatbot({
    name: 'custom-bot',
    run: async (ctx) => {
        const information = await ctx.embeddings.query({ input: ctx.input })
        const finalPrompt = `
    ${ctx.settings.prompt}
    [Information]:
    ${information.join('\n')}
    `
        return ctx.llm.chat({
            input: ctx.input,
            history: ctx.history,
            settingsPrompt: finalPrompt,
        })
    },
})

