import { createChatbot } from "../framework/chatbot";

export const customerServiceBot = createChatbot({
  name: 'customer-service-bot',
  displayName: 'Customer Service Bot',
  description: 'A bot that helps customers with their questions',
  settings: {},
  run: async (ctx) => {
    return ctx.llm.chat({
      input: ctx.input,
      history: [],
    });
  }
});
