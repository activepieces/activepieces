import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { inboxIdDropdown } from '../common/props';
import { airparserAuth } from '../../index';
import { makeRequest } from '../common';

export const uploadDocumentAction = createAction({
  auth: airparserAuth,
  name: 'upload_document',
  displayName: 'Upload Document',
  description: 'Upload a document to an Airparser inbox for parsing.',
  props: {
    inboxId: inboxIdDropdown,
    file: Property.File({
      displayName: 'File',
      description: 'The document file to upload for parsing.',
      required: true,
    }),
    meta: Property.Object({
      displayName: 'Metadata (optional)',
      description: 'Optional metadata to associate with the document.',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { inboxId, meta, file } = context.propsValue;

    const formData = new FormData();

    formData.append('file', new Blob([file.data]), file.filename);

    if (meta) {
      formData.append('meta', JSON.stringify(meta));
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/inboxes/${inboxId}/upload`,
      formData
    );
    return response;
  },
});
