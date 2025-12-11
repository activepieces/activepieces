import { createAction, Property } from '@activepieces/pieces-framework';
import { greenptAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      reasoning_content: string | null;
      tool_calls: Array<unknown>;
    };
    logprobs: null;
    finish_reason: string;
    stop_reason: number;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details: null;
  };
  prompt_logprobs: null;
}

export const chatCompletion = createAction({
  auth: greenptAuth,
  name: 'chatCompletion',
  displayName: 'Chat Completion',
  description: 'Send a message to GreenPT and get a chat completion response',
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The model to use for chat completion',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'Green L',
            value: 'green-l',
          },
          {
            label: 'Green L Raw',
            value: 'green-l-raw',
          },
          {
            label: 'Green R',
            value: 'green-r',
          },
          {
            label: 'Green R Raw',
            value: 'green-r-raw',
          },
        ],
      },
    }),
    messages: Property.Array({
      displayName: 'Message',
      description: 'Array of messages to send to GreenPT',
      required: true,
    }),
  },
  async run(context) {
    const { model, messages } = context.propsValue;
    const formattedMessages = messages.map((msg: any) => ({
      role: 'user',
      content: msg,
    }));

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/chat/completions',
      {
        model,
        messages: formattedMessages,
        stream: false,
      }
    );

    return response;
  },
});
