
import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../../index';

export const chatCompletion = createAction({
  name: 'chat_completion',
  auth: huggingFaceAuth,
  displayName: 'Chat Completion',
  description: 'Generate assistant replies using a chat-style LLM on Hugging Face',
  props: {
    model: Property.StaticDropdown({
      displayName: "Model",
      description: "Hugging Face model ID for chat completion",
      required: true,
      options: {
        disabled: false,
        options: [
          { label: "microsoft/DialoGPT-medium", value: "microsoft/DialoGPT-medium" },
          { label: "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B", value: "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B" },
          { label: "meta-llama/Meta-Llama-3.1-8B-Instruct", value: "meta-llama/Meta-Llama-3.1-8B-Instruct" },
          { label: "microsoft/phi-4", value: "microsoft/phi-4" },
          { label: "simplescaling/s1.1-32B", value: "simplescaling/s1.1-32B" },
          { label: "Qwen/Qwen2.5-7B-Instruct-1M", value: "Qwen/Qwen2.5-7B-Instruct-1M" },
          { label: "Qwen/Qwen2.5-Coder-32B-Instruct", value: "Qwen/Qwen2.5-Coder-32B-Instruct" },
          { label: "deepseek-ai/DeepSeek-R1", value: "deepseek-ai/DeepSeek-R1" },
          { label: "Qwen/Qwen2.5-VL-7B-Instruct", value: "Qwen/Qwen2.5-VL-7B-Instruct" },
        ]
      }
    }),
    messages: Property.Array({
      displayName: 'Messages',
      description: 'Array of conversation messages with role and content',
      required: true,
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'Maximum number of tokens to generate',
      required: false,
      defaultValue: 100,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Sampling temperature (0.0 to 2.0)',
      required: false,
      defaultValue: 0.7,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      description: 'Nucleus sampling parameter (0.0 to 1.0)',
      required: false,
      defaultValue: 0.9,
    }),
    stream: Property.Checkbox({
      displayName: 'Stream',
      description: 'Whether to stream the response',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { model, messages, maxTokens, temperature, topP, stream } = context.propsValue;

    const requestBody = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
      stream,
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://router.huggingface.co/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    return response.body;
  },
});