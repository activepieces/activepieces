import { convertToCoreMessages, streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { getSystemPrompt } from './prompts';
import { env } from 'node:process';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function aiAgent(message: Message[], apiKey: string) {
  return streamText({
    model: getAnthropicModel(apiKey),
    system: getSystemPrompt(),
    messages: convertToCoreMessages(message),
  });
}

function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({
    apiKey,
  });

  return anthropic('claude-3-5-sonnet-20241022');
}
