import { createAction, PiecePropValueSchema, Property, Validators } from '@activepieces/pieces-framework';
import { AI, AIChatMessage, AIChatRole } from '@activepieces/pieces-common';

export const askAi = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'askAi',
  displayName: 'Ask AI',
  description: '',
  props: {
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
    }),
    model: Property.DynamicProperties({
      displayName: 'Model',
      required: true,
      refreshers: ['provider'],
      props: async (propsValue) => {

        const provider = propsValue['provider'] as unknown as "openai" | "anthropic";

        switch (provider) {
          case 'openai':
            return {
              model: Property.StaticDropdown({
                displayName: 'Model',
                required: true,
                options: {
                  disabled: false,
                  options: [
                    { label: 'gpt-4o', value: 'gpt-4o' },
                    { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
                    { label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
                    { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
                  ],
                },
              }),
            };
          case 'anthropic':
            return {
              model: Property.StaticDropdown({
                displayName: 'Model',
                required: true,
                options: {
                  disabled: false,
                  options: [
                    {
                      label: 'claude-3-5-sonnet-20240620',
                      value: 'claude-3-5-sonnet-20240620'
                    },
                    {
                      label: 'claude-3-opus-20240229',
                      value: 'claude-3-opus-20240229',
                    },
                    {
                      label: 'claude-3-sonnet-20240229',
                      value: 'claude-3-sonnet-20240229',
                    },
                    {
                      label: 'claude-3-haiku-20240307',
                      value: 'claude-3-haiku-20240307',
                    },
                  ],
                },
              }),
            };
        }
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    conversationKey: Property.ShortText({
      displayName: 'Conversation Key',
      required: false,
    }),
    creativity: Property.Number({
      displayName: 'Creativity',
      required: false,
      defaultValue: 100,
      description: 'Controls the creativity of the AI response. A higher value will make the AI more creative and a lower value will make it more deterministic.',
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      defaultValue: 2000,
    }),
  },
  async run(context) {
    const provider = context.propsValue.provider

    if (provider === 'openai' || provider === 'anthropic') {
      const ai = AI({ provider, server: context.server })

      const storage = context.store

      const conversationKey = context.propsValue.conversationKey ? `ask-ai-conversation:${context.propsValue.conversationKey}` : null

      let conversation: { messages: AIChatMessage[] } | undefined = undefined
      if (conversationKey) {
        conversation = await storage.get<{ messages: AIChatMessage[] }>(conversationKey) ?? { messages: [] }
        if (!conversation) {
          await storage.put(conversationKey, { messages: [] })
        }
      }

      const response = await ai.chat.text({
        model: context.propsValue.model as unknown as string,
        messages: conversation?.messages ? [
          ...conversation.messages,
          {
            role: AIChatRole.USER,
            content: context.propsValue.prompt,
          },
        ] : [{ role: AIChatRole.USER, content: context.propsValue.prompt }],
        creativity: context.propsValue.creativity,
        maxTokens: context.propsValue.maxTokens,
      })

      conversation?.messages.push({
        role: AIChatRole.USER,
        content: context.propsValue.prompt,
      })

      conversation?.messages.push({
        role: AIChatRole.ASSISTANT,
        content: response.choices[0].content,
      })

      if (conversationKey) {
        await storage.put(conversationKey, conversation)
      }

      return response
    }

    throw new Error(`AI provider ${provider} not supported`)
  },
});
