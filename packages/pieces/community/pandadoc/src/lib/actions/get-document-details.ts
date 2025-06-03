import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pandadocClient, pandadocAuth, PandaDocAuthType } from '../common';
import { documentDropdown } from '../common/dynamic-dropdowns';

export const getDocumentDetails = createAction({
  name: 'getDocumentDetails',
  displayName: 'Get Document Details',
  description: 'Retrieve comprehensive document data including recipients, fields, pricing, and metadata for dashboards or audits',
  auth: pandadocAuth,
  props: {
    document_id: documentDropdown,
  },
  async run({ auth, propsValue }) {
    return await pandadocClient.makeRequest(
      auth as PandaDocAuthType,
      HttpMethod.GET,
      `/documents/${propsValue.document_id}/details`
    );
  },
});
