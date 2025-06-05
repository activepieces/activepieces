import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { documentIdDropdown, inboxIdDropdown } from '../common/props';
import { airparserAuth } from '../../index';

export const extractDataFromDocumentAction = createAction({
  auth: airparserAuth,
  name: 'extract_data_from_document',
  displayName: 'Extract Data from Document',
  description: 'Retrieve parsed JSON data from a specific document in Airparser.',
  props: {
    inboxId: inboxIdDropdown,
    documentId: documentIdDropdown,
  },
  async run(context) {
    const apiKey = context.auth as string;
    const { documentId } = context.propsValue;

    return await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/docs/${documentId}/extended`
    );
  },
});
