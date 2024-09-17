import OpenAI from 'openai';
import { AI, AIChatRole, AIFactory } from '../..';

export const openai: AIFactory = ({ proxyUrl, engineToken }): AI<OpenAI> => {
  const openaiApiVersion = 'v1';
  const sdk = new OpenAI({
    apiKey: engineToken,
    baseURL: `${proxyUrl}/${openaiApiVersion}`,
    defaultHeaders: {
      'X-AP-TOTAL-USAGE-BODY-PATH': 'usage.total_tokens',
    },
  });
  return {
    provider: 'OPENAI',
    chat: {
      text: async (params) => {
        const completion = await sdk.chat.completions.create({
          model: params.model,
          messages: params.messages.map((message) => ({
            role: message.role === 'user' ? 'user' : 'assistant',
            content: message.content,
          })),
          temperature: Math.tanh(params.creativity ?? 100),
          max_tokens: params.maxTokens,
          stop: params.stop,
        });

        return {
          choices: completion.choices.map((choice) => ({
            role: AIChatRole.ASSISTANT,
            content: choice.message.content ?? '',
          })),
          created: completion.created,
          id: completion.id,
          model: completion.model,
          usage: completion.usage && {
            completionTokens: completion.usage.completion_tokens,
            promptTokens: completion.usage.prompt_tokens,
            totalTokens: completion.usage.total_tokens,
          },
        };
      },
      extractStructuredData: async (params) => {
        const completion = await sdk.chat.completions.create({
          model: params.model,
          messages: params.messages.map((message) => ({
            role: message.role === 'user' ? 'user' : 'assistant',
            content: message.content,
          })),
          max_tokens: params.maxTokens,
          tools: [
            {
              type: 'function',
              function: {
                name: 'extract_structured_data',
                description:
                  'Extract the following data from the provided text.',
                parameters: {
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
            },
          ],
        });

        return {
          choices: completion.choices.map((choice) => ({
            role: AIChatRole.ASSISTANT,
            content: choice.message.content ?? '',
          })),
          toolCall: {
            id: completion.choices[0].message.tool_calls?.[0].id ?? '',
            type: 'function',
            function: {
              name:
                completion.choices[0].message.tool_calls?.[0].function.name ??
                'extract_structured_data',
              arguments: JSON.parse(
                completion.choices[0].message.tool_calls?.[0].function
                  .arguments as string
              ),
            },
          },
          created: completion.created,
          id: completion.id,
          model: completion.model,
          usage: completion.usage && {
            completionTokens: completion.usage.completion_tokens,
            promptTokens: completion.usage.prompt_tokens,
            totalTokens: completion.usage.total_tokens,
          },
        };
      },
    },
  };
};
