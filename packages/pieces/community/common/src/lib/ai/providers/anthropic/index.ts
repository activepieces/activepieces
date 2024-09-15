import { TextBlock, ToolUseBlock } from '@anthropic-ai/sdk/resources';
import { AI, AIChatRole, AIFactory } from '../..';
import Anthropic from '@anthropic-ai/sdk';

export const anthropic: AIFactory = ({
  proxyUrl,
  engineToken,
}): AI<Anthropic> => {
  const sdk = new Anthropic({
    apiKey: engineToken,
    baseURL: proxyUrl,
    defaultHeaders: {
      'X-AP-TOTAL-USAGE-BODY-PATH': 'usage.output_tokens+usage.input_tokens',
      Authorization: `Bearer ${engineToken}`,
    },
  });
  return {
    provider: 'ANTHROPIC' as const,
    chat: {
      text: async (params) => {
        const concatenatedSystemMessage = params.messages
          .filter((message) => message.role === 'system')
          .map((message) => message.content)
          .join('\n');
        const completion = await sdk.messages.create({
          model: params.model,
          messages: params.messages.map((message) => ({
            role: message.role === 'user' ? 'user' : 'assistant',
            content: message.content,
          })),
          temperature: Math.tanh(params.creativity ?? 100),
          stop_sequences: params.stop,
          system: concatenatedSystemMessage,
          stream: false,
          max_tokens: params.maxTokens ?? 2000,
        });

        return {
          choices: completion.content
            .filter((choice): choice is TextBlock => choice.type === 'text')
            .map((choice: TextBlock) => ({
              content: choice.text,
              role: AIChatRole.ASSISTANT,
            })),
          created: new Date().getTime(),
          id: completion.id,
          model: completion.model,
          usage: {
            completionTokens: completion.usage.output_tokens,
            promptTokens: completion.usage.input_tokens,
            totalTokens:
              completion.usage.output_tokens + completion.usage.input_tokens,
          },
        };
      },
      extractStructuredData: async (params) => {
        const completion = await sdk.messages.create({
          model: params.model,
          messages: params.messages.map((message) => ({
            role: message.role === 'user' ? 'user' : 'assistant',
            content: message.content,
          })),
          max_tokens: params.maxTokens ?? 2000,
          tools: [
            {
              name: 'extract_structured_data',
              description: 'Extract the following data from the provided text.',
              input_schema: {
                type: 'object',
                properties: params.functionCallingProps.reduce(
                  (acc, { name, type, description }) => {
                    acc[name] = { type, description };
                    return acc;
                  },
                  {} as Record<string, unknown>
                ),
                required: params.functionCallingProps
                  .filter((prop) => prop.isRequired)
                  .map((prop) => prop.name),
              },
            },
          ],
        });

        const toolCallsResponse: ToolUseBlock[] = completion.content.filter(
          (choice): choice is ToolUseBlock => choice.type === 'tool_use'
        );

        return {
          choices: completion.content
            .filter((choice): choice is TextBlock => choice.type === 'text')
            .map((choice: TextBlock) => ({
              content: choice.text,
              role: AIChatRole.ASSISTANT,
            })),
          toolCall: {
            id: toolCallsResponse[0].id,
            type: 'function',
            function: {
              name: toolCallsResponse[0].name ?? 'extract_structured_data',
              arguments: toolCallsResponse[0].input,
            },
          },
          id: completion.id,
          model: completion.model,
          created: new Date().getTime(),
          usage: {
            completionTokens: completion.usage.output_tokens,
            promptTokens: completion.usage.input_tokens,
            totalTokens:
              completion.usage.output_tokens + completion.usage.input_tokens,
          },
        };
      },
    },
  };
};
