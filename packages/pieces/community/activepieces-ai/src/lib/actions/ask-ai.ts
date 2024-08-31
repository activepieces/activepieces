import { createAction, Property } from '@activepieces/pieces-framework';
import { AI, AIChatMessage, AIChatRole } from '@activepieces/pieces-common';

export const askAi = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'askAi',
  displayName: 'Ask AI',
  description: '',
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'gpt-3.5-turbo',
            value: 'gpt-3.5-turbo',
          },
          {
            label: 'gpt-4o',
            value: 'gpt-4o',
          },
        ],
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    conversationKey: Property.ShortText({
      displayName: 'Conversation Key',
      required: true,
    }),
    creativity: Property.Number({
      displayName: 'Creativity',
      required: false,
      description: 'Controls the creativity of the AI response. A higher value will make the AI more creative and a lower value will make it more deterministic.',
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
    }),
    provider: Property.StaticDropdown({
      displayName: 'Provider',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'OpenAI',
            value: 'openai',
          },
          {
            label: 'Anthropic',
            value: 'anthropic',
          },
        ],
      },
    })
  },
  async run(context) {
    const provider = context.propsValue.provider

    if (provider === 'openai' || provider === 'anthropic') {
      const ai = AI({ provider, server: context.server })

      const storage = context.store

      const conversationKey = `ask-ai-conversation:${context.propsValue.conversationKey}`

      const conversation = await storage.get<{ messages: AIChatMessage[] }>(conversationKey) ?? { messages: [] }

      if (!conversation) {
        await storage.put(conversationKey, { messages: [] })
      }

      const response = await ai.chat.text({
        model: context.propsValue.model,
        messages: [
          ...conversation.messages,
          {
            role: AIChatRole.USER,
            content: context.propsValue.prompt,
          },
        ],
        creativity: context.propsValue.creativity,
        maxTokens: context.propsValue.maxTokens,
      })

      conversation.messages.push({
        role: AIChatRole.ASSISTANT,
        content: response.choices[0].content,
      })

      await storage.put(conversationKey, conversation)

      return response
    }

    throw new Error(`AI provider ${provider} not supported`)
  },
});
