import { Property, createAction } from '@activepieces/pieces-framework';
import { clarifaiAuth } from '../..';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

export const clarifaiGenerateIGM = createAction({
  name: 'generate-igm',
  displayName: 'Ask IGM',
  description:
    'Generate an image using the Image generating models supported by clarifai.',
  auth: clarifaiAuth,
  props: {
    models: Property.Dropdown({
      displayName: 'Model Id',
      description: `The model which will generate the response. If the model is not listed, get the model id from the clarifai website. Example : 'GPT-4' you can get the model id from here [https://clarifai.com/openai/chat-completion/models/GPT-4](https://clarifai.com/openai/chat-completion/models/GPT-4)`,
      refreshers: ['auth'],
      required: true,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please add an PAT key',
          };
        }
        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: 'https://api.clarifai.com/v2/models?sort_by_star_count=true&model_type_id=text-to-image&filter_by_user_id=true&additional_fields=stars&per_page=24&page=1',
          headers: {
            Authorization: ('Key ' + auth) as string,
          },
        };
        try {
          const response = await httpClient.sendRequest<{
            models: {
              id: string;
              name: string;
            }[];
          }>(request);

          return {
            options: response.body.models.map((model) => {
              return {
                label: model.name,
                value: model.id,
              };
            }),
            disabled: false,
          };
        } catch (error) {
          return {
            options: [],
            disabled: true,
            placeholder: `Couldn't Load Models:\n${error}`,
          };
        }
      },
      defaultValue: 'general-image-generator-dalle-mini',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The prompt to send to the model.',
      required: true,
    }),
  },
  run: async (context) => {
    const mId = context.propsValue.models as string;

    const findModel: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.clarifai.com/v2/models?name=${mId}&model_type_id=text-to-image`,
      headers: {
        Authorization: ('Key ' + context.auth) as string,
      },
    };
    let model;
    try {
      const response = await httpClient.sendRequest<{
        models: {
          id: string;
          name: string;
          model_version: {
            id: string;
            app_id: string;
            user_id: string;
          };
        }[];
      }>(findModel);
      model = response.body.models[0];
    } catch (error) {
      throw new Error(`Couldn't find model ${mId}\n${error}`);
    }
    const prompt = context.propsValue.prompt as string;
    const sendPrompt: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.clarifai.com/v2/users/${model.model_version.user_id}/apps/${model.model_version.app_id}/models/${model.id}/versions/${model.model_version.id}/outputs`,
      headers: {
        Authorization: ('Key ' + context.auth) as string,
      },
      body: {
        inputs: [
          {
            data: {
              text: {
                raw: prompt,
              },
            },
          },
        ],
      },
    };

    try {
      const response = await httpClient.sendRequest<{
        outputs: {
          id: string;
          data: {
            image: {
              base64: string;
              image_info: {
                format: string;
              };
            };
          };
        }[];
      }>(sendPrompt);
      return {
        result: await context.files.write({
          fileName:
            response.body.outputs[0].id +
            '.' +
            response.body.outputs[0].data.image.image_info.format,
          data: Buffer.from(
            response.body.outputs[0].data.image.base64,
            'base64'
          ),
        }),
      };
    } catch (error) {
      throw new Error(`Couldn't send prompt to model ${mId}\n${error}`);
    }
  },
});
