import OpenAI from 'openai';
import { AI, AIChatRole } from "../..";

export const openai = ({
  serverUrl,
  engineToken,
}: { serverUrl: string, engineToken: string }): AI<OpenAI> => {
  const openaiEndpoint = '/v1/chat/completions';
  const proxyUrl = `${serverUrl}v1/proxy/openai`
  const sdk = new OpenAI({
    apiKey: engineToken,
    baseURL: `${proxyUrl}${openaiEndpoint}`,
    defaultHeaders: {
      'X-AP-TOTAL-USAGE-BODY-PATH': 'usage.total_tokens',
    },
  });
  return {
    underlying: sdk,
    provider: "OPENAI" as const,
    chat: {
      text: async (params) => {
        const completion = await sdk.chat.completions.create({
          model: params.model,
          messages: params.messages.map((message) => ({
            role: message.role === 'user' ? 'user' : 'assistant',
            content: message.content,
          })),
          temperature: params.temperature,
          max_tokens: params.maxTokens,
          top_p: params.topP,
          frequency_penalty: params.frequencyPenalty,
          presence_penalty: params.presencePenalty,
          stop: params.stop,
        })

        return {
          choices: completion.choices.map((choice) => ({
            role: AIChatRole.ASSISTANT,
            content: choice.message.content ?? "",
          })),
          created: completion.created,
          id: completion.id,
          model: completion.model,
          usage: completion.usage && {
            completionTokens: completion.usage.completion_tokens,
            promptTokens: completion.usage.prompt_tokens,
            totalTokens: completion.usage.total_tokens,
          },
        }
      }
    },
  }
};