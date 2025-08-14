import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const chatCompletion = createAction({
  name: "chat_completion",
  displayName: "Chat Completion",
  description: "Generate chat responses using Hugging Face LLM models",
  props: {
    model: Property.ShortText({
      displayName: "Model",
      description: "Hugging Face model ID for chat completion",
      required: true,
      defaultValue: "microsoft/DialoGPT-medium"
    }),
    messages: Property.Array({
      displayName: "Messages",
      description: "Conversation messages",
      required: true,
      properties: {
        role: Property.StaticDropdown({
          displayName: "Role",
          description: "Message role",
          required: true,
          options: {
            options: [
              { label: "System", value: "system" },
              { label: "User", value: "user" },
              { label: "Assistant", value: "assistant" }
            ]
          }
        }),
        content: Property.LongText({
          displayName: "Content",
          description: "Message content",
          required: true
        })
      }
    }),
    max_tokens: Property.Number({
      displayName: "Max Tokens",
      description: "Maximum number of tokens to generate",
      required: false,
      defaultValue: 100
    }),
    temperature: Property.Number({
      displayName: "Temperature",
      description: "Sampling temperature (0.0 to 1.0)",
      required: false,
      defaultValue: 0.7
    }),
    top_p: Property.Number({
      displayName: "Top P",
      description: "Nucleus sampling parameter",
      required: false,
      defaultValue: 0.95
    }),
    use_cache: Property.Checkbox({
      displayName: "Use Cache",
      description: "Use cached results if available",
      required: false,
      defaultValue: true
    }),
    wait_for_model: Property.Checkbox({
      displayName: "Wait for Model",
      description: "Wait for model to load if not ready",
      required: false,
      defaultValue: false
    })
  },
  async run(context) {
    const { model, messages, max_tokens, temperature, top_p, use_cache, wait_for_model } = context.propsValue;
    
    const inputs = {
      inputs: messages.map((m:any) => `${m.role}: ${m.content}`).join('\n'),
      parameters: {
        max_new_tokens: max_tokens,
        temperature,
        top_p,
        return_full_text: false
      }
    };

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api-inference.huggingface.co/models/${model}`,
      headers: {
        'Authorization': `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
        'X-Use-Cache': use_cache ? 'true' : 'false',
        'X-Wait-For-Model': wait_for_model ? 'true' : 'false'
      },
      body: inputs
    });

    return response.body;
  }
});