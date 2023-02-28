import { createAction, Property } from '@activepieces/framework';
import { Configuration, OpenAIApi } from 'openai';

export const askOpenAI = createAction({
  name: 'ask_chatgpt',
  displayName: 'Ask ChatGPT',
  description: 'Using OpenAI will answer your question  .',
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

    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description: 'Controls the creativity of the generated text.',
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description: 'The maximum number of tokens in the generated text.',
    }),
  },
  sampleData: {},
  async run({ propsValue }) {
    const configuration = new Configuration({
      apiKey: propsValue.apiKey,
    });
    const openai = new OpenAIApi(configuration);

    let temperature = 0.9;
    if (propsValue.temperature) {
      temperature = propsValue.temperature;
    }
    let maxTokens = 2048;
    if (propsValue.maxTokens) {
      maxTokens = propsValue.maxTokens;
    }
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: propsValue['prompt']!,
      temperature: temperature,
      max_tokens: maxTokens,
      top_p: 1,
      frequency_penalty: 0.0,
      presence_penalty: 0.6,
    });
    return response.data.choices[0].text?.trim();
  },
});
