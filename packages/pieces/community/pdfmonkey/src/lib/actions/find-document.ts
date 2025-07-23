import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { documentIdDropdown } from '../common/props';

export const findDocument = createAction({
  auth: pdfmonkeyAuth,
  name: 'findDocument',
  displayName: 'Find Document',
  description: '',
  props: {
    document_id: documentIdDropdown,
  },
  async run({ auth, propsValue }) {
    const { document_id } = propsValue;
    return await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/documents/${document_id}`
    );
  },
});
