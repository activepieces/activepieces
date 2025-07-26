// https://docs.x.ai/docs/guides/image-generations

import { createAction, Property } from '@activepieces/pieces-framework';
import { grokAuth } from '../auth';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const generateImage = createAction({
  name: 'generate_image',
  displayName: 'Generate Image',
  description: 'Create brand-new images from text prompts',
  auth: grokAuth,
  props: {
    textPrompt: Property.LongText({
      displayName: 'Prompt',
      description: 'Text prompts and details on what image you want to create (e.g., illustrations, visuals)',
      required: true,
    }),
    total: Property.Number({
      displayName: 'Total',
      description: 'The total number of images to generate',
      required: true,
    }),
    selectModel: Property.Dropdown({
      displayName: 'Select Model',
      description: 'Select the model to use for image generation',
      required: true,
      refreshers: [],
      options: async (props) => {
        const auth = props['auth'] as { apiKey: string };

        try {
          // https://docs.x.ai/docs/api-reference#list-image-generation-models
          const response = await makeRequest({ auth, path: '/image-generation-models', method: HttpMethod.GET });
          return response.body.data.map((model: any) => ({ label: model.id, value: model.id }));
        } catch(err: any) {
          return {
            disabled: true,
            options: [{ label: err.status === 403 ? "Please check your account credits" : 'Error fetching models', value: 'error' }],
          };
        }
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { textPrompt, selectModel, total } = propsValue;

    const body = {
      prompt: textPrompt,
      model: selectModel,
      response_format: "url",
      n: total
    };

    try{
      const response = await makeRequest({ auth, path: `/images/generations`, method: HttpMethod.POST, body });

      return {
        success: true,
        data: response.body.data
      };
    } catch (err: any) {
      const statusCode = err.response?.status;
      let errorMessage = err.response?.body?.error || 'An unknown error occurred';

      if (statusCode === 422) errorMessage = 'Third party service unable to process your request. Please try again later.';
      if (statusCode === 400) errorMessage = 'Invalid request. Please check your parameters.';
      if (statusCode === 403) errorMessage = 'Forbidden request. Please check your account permissions and make sure you have enough credits.';

      return {
        success: false,
        error: errorMessage
      };
    }
  },
});