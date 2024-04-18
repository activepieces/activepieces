import { straicoAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

import { baseUrl } from '../common/common';

export const promptCompletion = createAction({
  auth: straicoAuth,
  name: 'prompt_completion',
  displayName: 'Ask AI',
  description: 'Enables users to generate prompt completion based on a specified model.',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      description:
        'The model which will generate the completion. Some models are suitable for natural language tasks, others specialize in code.',
      refreshers: [],
      defaultValue: 'openai/gpt-3.5-turbo-0125',
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Enter your API key first',
            options: [],
          };
        }
        try {
          const models = await httpClient.sendRequest<{
            data: { name: string, model: string }[];
          }>({
            url: `${baseUrl}/models`,
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: auth as string,
            },
          });
          return {
            disabled: false,
            options: models.body?.data?.map((model: any) => {
              return {
                label: model.name,
                value: model.model,
              };
            }) || [],
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load models, API key is invalid",
          };
        }
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest<{
      data: { completion: {
        choices: { message: {
          content: string;
        } }[];
      } };
    }>({
      url: `${baseUrl}/prompt/completion`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth as string,
      },
      body: {
        model: propsValue.model,
        message: propsValue.prompt,
      },
    });

    return response.body.data.completion.choices[0].message.content;
  },
});
