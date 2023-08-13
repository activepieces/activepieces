import { Property } from '@activepieces/pieces-framework';
import { createChatbot } from '../framework/chatbot';

export const customBot = createChatbot({
  name: 'custom-bot',
  displayName: 'Custom Bot',
  description: 'build a llm bot on your own data',
  settings: {
    prompt: Property.ShortText({
      displayName: 'Prompt',
      description: 'The prompt that the bot will use',
      required: true
    })
  },
  run: async (ctx) => {
    const information = await ctx.embeddings.query({ input: ctx.input });
    const finalPrompt = `
    ${ctx.settings.prompt}
    [Information]:
    ${information.join('\n')}
    [Question]:
    ${ctx.input}
    `;

    console.log(finalPrompt);
    return ctx.llm.chat({
      input: finalPrompt,
      history: []
    });
  }
});
