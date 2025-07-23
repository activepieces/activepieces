import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const generateDocument = createAction({
  auth: pdfmonkeyAuth,
  name: 'generateDocument',
  displayName: 'Generate Document',
  description: '',
  props: {
    document_template_id: Property.ShortText({
      displayName: 'Document Template ID',
      description: 'ID of your PDFMonkey template',
      required: true,
    }),
    payload: Property.Json({
      displayName: 'Payload',
      description: 'Data to fill the template',
      required: true,
    }),
    meta: Property.Json({
      displayName: 'Meta',
      description: 'Meta information (e.g., filename, clientRef)',
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'Document status (e.g., pending)',
      required: false,
      defaultValue: 'pending',
    }),
  },
  async run({ auth, propsValue }) {
    const { document_template_id, payload, meta, status } = propsValue;

    const body = {
      document: {
        document_template_id,
        status: status || 'pending',
        payload,
        ...(meta ? { meta } : {}),
      },
    };

    return await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/documents',
      body
    );
  },
});