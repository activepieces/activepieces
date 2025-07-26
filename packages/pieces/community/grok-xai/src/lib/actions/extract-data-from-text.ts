// https://docs.x.ai/docs/api-reference#chat-completions

import { createAction, Property } from '@activepieces/pieces-framework';
import { grokAuth } from '../auth';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const extractDataFromText = createAction({
  name: 'extract_data_from_text',
  displayName: 'Extract Data from Text',
  description: 'Extract structured data from a text input using predefined patterns',
  auth: grokAuth,
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text input to extract data',
      required: true,
    }),
    structure: Property.Array({
      displayName: 'Structure',
      description: 'The structure to extract from the text',
      required: true,
      properties: {
        name: Property.ShortText({
          displayName: 'Name',
          description: 'The key name of the object field\'s result',
          required: true,
        }),
        detail: Property.ShortText({
          displayName: 'Detail',
          description: 'The detail of this field to help the AI extract the correct data',
          required: true,
        }),
      },
    }),
    selectModel: Property.Dropdown({
      displayName: 'Select Model',
      description: 'Select the model to use for image generation',
      required: true,
      refreshers: [],
      options: async (props) => {
        const auth = props['auth'] as { apiKey: string };

        try {
          // https://docs.x.ai/docs/api-reference#list-language-models
          const response = await makeRequest({ auth, path: '/language-models', method: HttpMethod.GET });
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
    const { text, selectModel } = propsValue;

    const body = {
      model: selectModel,
      messages: [
        { role: 'system', content: `You are a text extraction assistant. When given input text, carefully analyze and extract structured data of \`\`, etc. Respond with the result as a JSON object only.` },
        { role: 'user', content: text },
      ],
    };

    try{
      const response = await makeRequest({ auth, path: `/chat/completions`, method: HttpMethod.POST, body });

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