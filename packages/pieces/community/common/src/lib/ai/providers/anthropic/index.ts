import { AI, AIChatRole } from "../..";
import Anthropic from '@anthropic-ai/sdk';


export const anthropic = ({
  serverUrl,
  engineToken,
}: { serverUrl: string, engineToken: string }): AI<Anthropic> => {
  const anthropicEndpoint = '/v1/chat/completions';
  const proxyUrl = `${serverUrl}v1/proxy/anthropic`
  const sdk = new Anthropic({
    apiKey: engineToken,
    baseURL: `${proxyUrl}${anthropicEndpoint}`,
  })
  return {
    underlying: sdk,
    provider: "ANTHROPIC" as const,
    chat: {
      completions: {
        create: async (params) => {
          const completion = await sdk.messages.create({
            model: params.model,
            messages: params.messages.map((message) => ({
              role: message.role === 'user' ? 'user' : 'assistant',
              content: message.content,
            })),
            temperature: params.temperature,
            top_p: params.topP,
            max_tokens: params.maxTokens ?? 2000,
          })

          return {
            choices: completion.content.map(choice => {
              return {
                content: choice.text,
                role: AIChatRole.ASSISTANT,
              }
            }),
            created: new Date().getTime(),
            id: completion.id,
            model: completion.model,
            usage: {
              completionTokens: completion.usage.output_tokens,
              promptTokens: completion.usage.input_tokens,
              totalTokens: completion.usage.output_tokens + completion.usage.input_tokens,
            },
          }
        },
      },
    },
  }
};