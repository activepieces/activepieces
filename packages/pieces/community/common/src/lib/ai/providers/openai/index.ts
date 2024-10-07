import OpenAI from 'openai';
import { AI, AIChatRole, AIFactory } from '../..';
import FormData from 'form-data';
import mime from 'mime-types';
import { httpClient, HttpMethod } from '../../../http';
import { AuthenticationType } from '../../../authentication';

export const openai: AIFactory = ({ proxyUrl, engineToken }): AI => {
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
    image: {
      generate: async (params) => {
        const response = await sdk.images.generate({
          model: params.model,
          prompt: params.prompt,
          quality: params.quality as any,
          size: params.size as any,
          response_format: 'b64_json',
        });
        const imageBase64 = response.data[0].b64_json;
        return imageBase64 ? { image: imageBase64 } : null;
      },
    },
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
      function: async (params) => {
        const completion = await sdk.chat.completions.create({
          model: params.model,
          messages: params.messages.map((message) => ({
            role: message.role === 'user' ? 'user' : 'assistant',
            content: message.content,
          })),
          max_tokens: params.maxTokens,
          tools: params.functions.map((functionDefinition) => ({
            type: 'function',
            function: {
              name: functionDefinition.name,
              description: functionDefinition.description,
              parameters: {
                type: 'object',
                properties: functionDefinition.arguments.reduce(
                  (acc, { name, type, description }) => {
                    acc[name] = { type, description };
                    return acc;
                  },
                  {} as Record<string, unknown>
                ),
                required: functionDefinition.arguments
                  .filter((prop) => prop.isRequired)
                  .map((prop) => prop.name),
              },
            },
          })),
        });

        const toolCall = completion.choices[0].message.tool_calls?.[0];

        return {
          choices: completion.choices.map((choice) => ({
            role: AIChatRole.ASSISTANT,
            content: choice.message.content ?? '',
          })),
          call: toolCall
            ? {
                id: toolCall.id,
                function: {
                  name: toolCall.function.name,
                  arguments: JSON.parse(toolCall.function.arguments as string),
                },
              }
            : null,
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
    voice: {
      createSpeech: async (params) => {
        const response = await sdk.audio.speech.create({
          model: params.model,
          input: params.input,
          voice: params.voice as
            | 'alloy'
            | 'echo'
            | 'fable'
            | 'onyx'
            | 'nova'
            | 'shimmer',
          speed: params.speed,
          response_format: params.response_format as
            | 'mp3'
            | 'opus'
            | 'aac'
            | 'flac'
            | 'wav'
            | 'pcm',
        });
        return {
          data: Buffer.from(await response.arrayBuffer()),
        };
      },
      createTranscription: async (params) => {
        const form = new FormData();
        form.append('file', params.audio.data, {
          filename: params.audio.filename,
          contentType: mime.lookup(params.audio.extension || '') as string,
        });
        form.append('model', params.model);
        form.append('language', params.language);

        const response = await httpClient.sendRequest<{ text: string }>({
          url: `${proxyUrl}/${openaiApiVersion}`,
          method: HttpMethod.POST,
          body: form,
          headers: {
            ...form.getHeaders(),
            'X-AP-TOTAL-USAGE-BODY-PATH': 'usage.total_tokens',
          },
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: engineToken,
          },
        });

        return response.body;
      },
    },
  };
};
