import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdownDescription = `
Follow these instructions to get your OpenAI API Key:

1. Visit the following website: https://platform.openai.com/account/api-keys.
2. Once on the website, locate and click on the option to obtain your OpenAI API Key.

It is strongly recommended that you add your credit card information to your OpenAI account and upgrade to the paid plan **before** generating the API Key. This will help you prevent 429 errors.
`

export const askOpenAI = createAction({
  name: 'ask_chatgpt',
  displayName: 'Ask ChatGPT',
  description: 'Ask ChatGPT anything you want!',
  props: {
    apiKey: Property.SecretText({
      description: markdownDescription,
      displayName: 'Api Key',
      required: true,
    }),
        model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      description:
        'The model which will generate the completion. Some models are suitable for natural language tasks, others specialize in code.',
      refreshers: ['apiKey'],
      defaultValue: "gpt-3.5-turbo",
      options: async (value) => {
        if (!value['apiKey']) {
          return {
            disabled: true,
            placeholder: 'Enter your api key first',
            options: [],
          };
        }
        try {
          const response = await httpClient.sendRequest<{
            data: {id: string}[]
          }>({
            url: 'https://api.openai.com/v1/models',
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: value['apiKey'] as string
            }
          })
          return {
            disabled: false,
            options: response.body.data.map((model) => {
              return {
                label: model.id,
                value: model.id
              }
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Couldn\'t Load Models, API Key is Invalid'
          }
        }
      }
    }),
    prompt: Property.LongText({
      displayName: 'Question',
      required: true,
      description: 'The question to ask OpenAI.',
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description:
        'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description:
        "The maximum number of tokens to generate. Requests can use up to 2,048 or 4,096 tokens shared between prompt and completion, don't set the value to maximum and leave some tokens for the input. The exact limit varies by model. (One token is roughly 4 characters for normal English text)",
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      description:
        'An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.',
    }),
    frequencyPenalty: Property.Number({
      displayName: 'Frequency penalty',
      required: false,
      description:
        "Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model's likelihood to repeat the same line verbatim.",
    }),
    presencePenalty: Property.Number({
      displayName: 'Presence penalty',
      required: false,
      description:
        "Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the mode's likelihood to talk about new topics.",
    }),
    roles: Property.Json({
      displayName: 'Roles',
      required: false,
      description: 'Array of roles to specify more accurate response',
      defaultValue: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Who won the world series in 2020?' },
        {
          role: 'assistant',
          content: 'The Los Angeles Dodgers won the World Series in 2020.',
        },
      ],
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
      temperature = Number(propsValue.temperature);
    }
    let maxTokens = 2048;
    if (propsValue.maxTokens) {
      maxTokens = Number(propsValue.maxTokens);
    }
    let topP = 1;
    if (propsValue.topP) {
      topP = Number(propsValue.topP);
    }
    let frequencyPenalty = 0.0;
    if (propsValue.frequencyPenalty) {
      frequencyPenalty = Number(propsValue.frequencyPenalty);
    }
    let presencePenalty = 0.6;
    if (propsValue.presencePenalty) {
      presencePenalty = Number(propsValue.presencePenalty);
    }

    const rolesArray = propsValue.roles
      ? (propsValue.roles as unknown as ChatCompletionRequestMessage[])
      : [];
    const roles = rolesArray.map((item) => {
      const rolesEnum = ['system', 'user', 'assistant'];
      if (!rolesEnum.includes(item.role)) {
        throw new Error(
          'The only available roles are: [system, user, assistant]'
        );
      }

      return {
        role: item.role,
        content: item.content,
      };
    });

    const maxRetries = 4;
    let retries = 0;
    let response: string | undefined

    while (retries < maxRetries) {
      try {
        response = (await openai.createChatCompletion({
          model: model,
          messages: [
            ...roles,
            {
              role: 'user',
              content: propsValue['prompt'],
            },
          ],
          temperature: temperature,
          max_tokens: maxTokens,
          top_p: topP,
          frequency_penalty: frequencyPenalty,
          presence_penalty: presencePenalty,
        })).data.choices[0].message?.content.trim();
        break; // Break out of the loop if the request is successful
      } catch (error) {
        console.error(`An error occurred: ${error}`);

        if (retries + 1 === maxRetries) {
          throw error;
        }
        // Calculate the time delay for the next retry using exponential backoff
        const delay = Math.pow(6, retries) * 1000;
        console.log(`Retrying in ${delay} milliseconds...`);
        await sleep(delay); // Wait for the calculated delay
        retries++;
      }
    }
    return response;
  },
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
