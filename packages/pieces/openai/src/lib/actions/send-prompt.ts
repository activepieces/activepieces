import { createAction, Property } from '@activepieces/pieces-framework';
import { Configuration, OpenAIApi } from 'openai';

export const askOpenAI = createAction({
  name: 'ask_chatgpt',
  displayName: 'Ask ChatGPT',
  description: 'Ask ChatGPT anything you want!',
  props: {
    apiKey: Property.SecretText({
      displayName: 'Api Key',
      required: true,
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      required: true,
      description: 'The question to ask OpenAI.',
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: false,
      description: 'The model which will generate the completion. Some models are suitable for natural language tasks, others specialize in code.',
      options: {
        options: [
          {
            label: 'gpt-3.5-turbo',
            value: 'gpt-3.5-turbo',
          },
          {
            label: 'gpt-3.5-turbo-0301',
            value: 'gpt-3.5-turbo-0301',
          },
        ],
      },
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description: 'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description: 'The maximum number of tokens to generate. Requests can use up to 2,048 or 4,000 tokens shared between prompt and completion. The exact limit varies by model. (One token is roughly 4 characters for normal English text)',
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      description: 'Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered.',
    }),
    frequencyPenalty: Property.Number({
      displayName: 'Frequency penalty',
      required: false,
      description: 'How much to penalize new tokens based on their existing frequency in the text so far. Decreases the model\'s likelihood to repeat the same line verbatim.',
    }),
    presencePenalty: Property.Number({
      displayName: 'Presence penalty',
      required: false,
      description: 'How much to penalize new tokens based on whether they appear in the text so far. Increases the model\'s likelihood to talk about new topics.',
    }),
  },
  sampleData: {},
  async run({ propsValue }) {
    const configuration = new Configuration({
      apiKey: propsValue.apiKey,
    });
    const openai = new OpenAIApi(configuration);

    let model = 'gpt-3.5-turbo';
    if (propsValue.model) {
      model = propsValue.model;
    }
    let temperature = 0.9;
    if (propsValue.temperature) {
      temperature = propsValue.temperature;
    }
    let maxTokens = 2048;
    if (propsValue.maxTokens) {
      maxTokens = propsValue.maxTokens;
    }
    let topP = 1;
    if (propsValue.topP) {
      topP = propsValue.topP;
    }
    let frequencyPenalty = 0.0;
    if (propsValue.frequencyPenalty) {
      frequencyPenalty = propsValue.frequencyPenalty;
    }
    let presencePenalty = 0.6;
    if (propsValue.presencePenalty) {
      presencePenalty = propsValue.presencePenalty;
    }

    const response = await openai.createChatCompletion({
      model: model,
      messages: [{
        role: "user",
        content: propsValue['prompt']!
      }],
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
    });
    return response.data.choices[0].message?.content.trim();
  }
});
