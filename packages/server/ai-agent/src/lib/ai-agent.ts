import { convertToCoreMessages, generateText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { getSystemPrompt } from './prompts';
import { llmMessageParser } from './llm-parser';

export type LLMResponseTextBlock = {
  type: 'text',
  text: string,
}

export type LLMResponseActionsBlock = {
  type: 'operations',
  operations: [
    {
      type: 'createAction',
      displayName?: string,
      id?: string,
      inputs: Record<string, string>,
      code: string
    },
    {
      type: 'updateAction',
      displayName?: string,
      id: string,
      inputs: Record<string, string>,
      code: string
    },
    {
      type: 'updateTrigger',
      id: string,
      triggerType: 'schedule' | 'webhook',
      inputs: Record<string, string>,
      code: string
    },
  ]
}

export type LLMResponse = {
  blocks: (LLMResponseTextBlock | LLMResponseActionsBlock)[]
}

export type Message = {
  role: 'user' | 'assistant';
  content: string | LLMResponse;
};

export const aiAgent = {
  async run(messages: Message[], apiKey: string) {
    const coreMessages = messages.map((message) => ({
      role: message.role,
      content: typeof message.content === 'object' ? JSON.stringify(message.content) : message.content,
    }));
    const { text } = await generateText({
      model: getAnthropicModel(apiKey),
      system: getSystemPrompt(),
      messages: convertToCoreMessages(coreMessages),
    });
    return llmMessageParser.parse(text);
  }
}
function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });

  return anthropic('claude-3-5-sonnet-20241022');
}
