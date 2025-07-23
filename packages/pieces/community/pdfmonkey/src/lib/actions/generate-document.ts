import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { documenttemplateidDropdown } from '../common/props';

export const generateDocument = createAction({
  auth: pdfmonkeyAuth,
  name: 'generateDocument',
  displayName: 'Generate Document',
  description: '',
  props: {
    document_template_id: documenttemplateidDropdown,
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
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Document status (e.g., draft, pending)',
      required: false,
      defaultValue: 'draft',
      options: {
        options: [
          {
            label: 'Draft',
            value: 'draft',
          },
          {
            label: 'Pending',
            value: 'pending',
          },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { document_template_id, payload, meta, status } = propsValue;

    const body = {
      document: {
        document_template_id,
        status,
        payload,
        ...(meta ? { meta } : {}),
      },
    };
    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/documents',
      body
    );
    return {
      status: 'success',
      message: 'Document generated successfully',
      data: response.document,
    };
  },
});
