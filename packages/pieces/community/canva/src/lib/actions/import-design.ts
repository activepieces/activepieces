import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../auth';

export const importDesign = createAction({
  auth: canvaAuth,
  name: 'import_design',
  displayName: 'Import Design from URL',
  description: 'Import an external file (PDF, PPTX, etc.) from a URL as a new Canva design.',
  props: {
    url: Property.ShortText({
      displayName: 'File URL',
      description: 'Publicly accessible URL of the file to import (e.g. a PDF or PPTX).',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Design Title',
      description: 'Title for the imported design.',
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      url: context.propsValue.url,
    };
    if (context.propsValue.title) body['title'] = context.propsValue.title;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.canva.com/rest/v1/imports',
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });
    return response.body;
  },
});
