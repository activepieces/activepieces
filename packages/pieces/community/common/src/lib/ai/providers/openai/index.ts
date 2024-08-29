import { AI, AIChatRole } from "../..";
import { httpClient, HttpMethod } from "../../../http";

export type OpenAIChatModel =
  | "gpt-3.5-turbo-instruct"
  | "gpt-3.5-turbo-1106"
  | "gpt-3.5-turbo"
  | "gpt-3.5-turbo-0125"
  | "gpt-4-0613"
  | "gpt-4"
  | "gpt-4-1106-preview"
  | "gpt-4-0125-preview"
  | "gpt-4-turbo-preview"
  | "gpt-4-turbo-2024-04-09"
  | "gpt-4-turbo"
  | "gpt-4o-mini-2024-07-18"
  | "gpt-4o-mini"
  | "chatgpt-4o-latest"
  | "gpt-4o-2024-08-06"
  | "gpt-4o-2024-05-13"
  | "gpt-4o"

export const openai = ({
  serverUrl,
  engineToken,
}: { serverUrl: string, engineToken: string }): AI<"OPENAI", OpenAIChatModel> => ({
  provider: "OPENAI",
  chat: {
    completions: {
      create: async (params) => {
        const openaiEndpoint = '/v1/chat/completions';
        const proxyUrl = `${serverUrl}v1/proxy/openai`
        const response = await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: `${proxyUrl}${openaiEndpoint}`,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${engineToken}`,
          },
          body: params,
        });

        const choices = (response.body.choices as Array<{ message: { role: string, content: string }, finish_reason: string }>)

        return {
          choices: choices.map((choice) => {
            return {
              index: 0,
              message: {
                role: choice.message.role as AIChatRole,
                content: choice.message.content,
              },
              finishReason: choice.finish_reason,
            }
          }),
          created: response.body.created,
          id: response.body.id,
          model: response.body.model,
          object: "chat.completion",
          usage: {
            completionTokens: response.body.usage.completion_tokens,
            promptTokens: response.body.usage.prompt_tokens,
            totalTokens: response.body.usage.total_tokens,
          },
        }
      },
    },
  },
});