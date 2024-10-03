import {
  AI,
  AIChatMessage,
  AIChatRole,
  aiProps,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

export const askAi = createAction({
  name: 'askAi',
  displayName: 'Ask AI',
  description: '',
  props: {
    provider: aiProps('text').provider,
    model: aiProps('text').model,
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
      description:
        'Controls the creativity of the AI response. A higher value will make the AI more creative and a lower value will make it more deterministic.',
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      defaultValue: 2000,
    }),
  },
  async run(context) {

    const ai = AI({ provider: context.propsValue.provider, server: context.server });

    const storage = context.store;

    const conversationKey = context.propsValue.conversationKey
      ? `ask-ai-conversation:${context.propsValue.conversationKey}`
      : null;

    let conversation: { messages: AIChatMessage[] } | undefined = undefined;
    if (conversationKey) {
      conversation = (await storage.get<{ messages: AIChatMessage[] }>(
        conversationKey
      )) ?? { messages: [] };
      if (!conversation) {
        await storage.put(conversationKey, { messages: [] });
      }
    }

    const response = await ai.chat.text({
      model: context.propsValue.model,
      messages: conversation?.messages
        ? [
            ...conversation.messages,
            {
              role: AIChatRole.USER,
              content: context.propsValue.prompt,
            },
          ]
        : [{ role: AIChatRole.USER, content: context.propsValue.prompt }],
      creativity: context.propsValue.creativity,
      maxTokens: context.propsValue.maxTokens,
    });

    conversation?.messages.push({
      role: AIChatRole.USER,
      content: context.propsValue.prompt,
    });

    conversation?.messages.push({
      role: AIChatRole.ASSISTANT,
      content: response.choices[0].content,
    });

    if (conversationKey) {
      await storage.put(conversationKey, conversation);
    }

    return response.choices[0].content;
  },
});
