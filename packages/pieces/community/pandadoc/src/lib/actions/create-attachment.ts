import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pandadocClient, pandadocAuth } from '../common';
import { documentDropdown } from '../common/dynamic-dropdowns';

export const createAttachment = createAction({
  name: 'createAttachment',
  displayName: 'Create Attachment',
  description: 'Adds an attachment to a document.',
  auth: pandadocAuth,
  props: {
    document_id: documentDropdown,
    source: Property.ShortText({
      displayName: 'File URL',
      description: 'URL link to the file to be attached to the document',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Attachment Name',
      description: 'Optional name to set for the uploaded file.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: any = {
      source: propsValue.source,
    };

    if (propsValue.name) {
      body.name = propsValue.name;
    }

    return await pandadocClient.makeRequest(
      auth as string,
      HttpMethod.POST,
      `/documents/${propsValue.document_id}/attachments`,
      body
    );
  },
});
