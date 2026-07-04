import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pandadocClient, pandadocAuth } from '../common';
import { documentDropdown } from '../common/dynamic-dropdowns';

export const getDocumentDetails = createAction({
  name: 'getDocumentDetails',
  displayName: 'Get Document',
  description: 'Retrieves comprehensive document data.',
  audience: 'both',
  aiMetadata: {
    description: 'Retrieve the full detail record for a single PandaDoc document by its ID, including status, recipients, fields, and metadata. Use when you already know the document ID and need its complete data. Read-only and idempotent.',
    idempotent: true,
  },
  auth: pandadocAuth,
  props: {
    document_id: documentDropdown,
  },
  async run({ auth, propsValue }) {
    return await pandadocClient.makeRequest(
      auth.secret_text,
      HttpMethod.GET,
      `/documents/${propsValue.document_id}/details`
    );
  },
});
