import { AI, AIChatRole, AIFactory } from "../..";
import Anthropic from '@anthropic-ai/sdk';


export const anthropic: AIFactory = ({
  serverUrl,
  engineToken,
}: { serverUrl: string, engineToken: string }): AI<Anthropic> => {
  const proxyUrl = `${serverUrl}v1/proxy/anthropic`
  const sdk = new Anthropic({
    apiKey: engineToken,
    baseURL: proxyUrl,
    defaultHeaders: {
      'X-AP-TOTAL-USAGE-BODY-PATH': 'usage.output_tokens+usage.input_tokens',
      'Authorization': `Bearer ${engineToken}`,
    },
  })
  return {
    underlying: sdk,
    provider: "ANTHROPIC" as const,
    chat: {
      text: async (params) => {
        const concatenatedSystemMessage = params.messages.filter(message => message.role === 'system').map(message => message.content).join('\n');
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
        })

        return {
          choices: completion.content.map(choice => ({
            content: choice.text,
            role: AIChatRole.ASSISTANT,
          })),
          created: new Date().getTime(),
          id: completion.id,
          model: completion.model,
          usage: {
            completionTokens: completion.usage.output_tokens,
            promptTokens: completion.usage.input_tokens,
            totalTokens: completion.usage.output_tokens + completion.usage.input_tokens,
          },
        }
      }
    },
  }
};