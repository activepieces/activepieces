import { createAction, Property } from '@activepieces/pieces-framework';
import { randomBytes } from 'node:crypto';
import { kebabCase } from 'lodash';

import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { stableDiffusionAuth, StableDiffusionAuthType } from '../../index';

export const textToImage = createAction({
  name: 'textToImage',
  displayName: 'Text to Image',
  description: '',
  auth: stableDiffusionAuth,
  props: {
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
    }),
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        }
        const { baseUrl } = auth as StableDiffusionAuthType;
        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: `${baseUrl}/sdapi/v1/sd-models`,
          headers: {
            'Content-Type': 'application/json',
          },
        };
        const response = await httpClient.sendRequest(request);
        const options = response.body
          ?.map((model: { model_name: string }) => {
            return {
              label: model.model_name,
              value: model.model_name,
            };
          })
          ?.sort((a: { label: string }, b: { label: string }) =>
            a['label'].localeCompare(b['label'])
          );
        return {
          options: options,
        };
      },
    }),
    advancedParameters: Property.Object({
      displayName: 'Advanced parameters (key/value)',
      required: false,
      description: 'Refer to API documentation',
    }),
  },
  async run({ auth, propsValue, files }) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${auth.baseUrl}/sdapi/v1/txt2img`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...propsValue.advancedParameters,
        prompt: propsValue.prompt,
        override_settings: {
          sd_model_checkpoint: propsValue.model,
        },
        override_settings_restore_afterwards: true,
      }),
    };
    const response = await httpClient.sendRequest(request);
    const images = await Promise.all(
      response.body['images']?.map(async (imageBase64: string) => {
        const fileName = `${randomBytes(16).toString('hex')}-${kebabCase(
          propsValue.prompt
        ).slice(0, 42)}.png`;
        const imageUrl = await files.write({
          fileName,
          data: Buffer.from(imageBase64, 'base64'),
        });
        return {
          fileName,
          url: imageUrl,
        };
      })
    );
    return {
      images,
    };
  },
});
