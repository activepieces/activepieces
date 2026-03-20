import { createAction, Property } from '@activepieces/pieces-framework';
import { promptmateAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const useTemplate = createAction({
  auth: promptmateAuth,
  name: 'use_template',
  displayName: 'Use Template',
  description: 'Create an app from a specific PromptMate template',
  props: {
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'The ID of the template to use',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { templateId } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.promptmate.io/v1/templates/use',
      headers: {
        'x-api-key': auth.secret_text,
        'Content-Type': 'application/json',
      },
      body: {
        templateId,
      },
    });

    return response.body;
  },
});
