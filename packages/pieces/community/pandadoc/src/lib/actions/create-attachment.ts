import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

import { documentDropdown } from '../common/utils';
import { pandadocAuth } from '../common/auth';

export const createAttachment = createAction({
  auth: pandadocAuth,
  name: 'createAttachment',
  displayName: 'Create Attachment',
  description: 'Add an attachment to a document using a file URL',
  props: {
    documentId: documentDropdown,
    source: Property.ShortText({
      displayName: 'File URL',
      description: 'URL link to the file to be attached to the document',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'File Name',
      description: 'Optional name to set for the uploaded file',
      required: false,
    }),
  },
  async run(context) {
    const { documentId } = context.propsValue;
    const body: any = {
      source: context.propsValue.source,
    };
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.pandadoc.com/public/v1/documents/${documentId}/attachments`,
      headers: {
        Authorization: `API-Key ${context.auth.apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
