import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { documentDropdown } from '../common/utils';
import { pandadocAuth, PandaDocAuthType, pandadocClient } from '../common';
export const getDocumentDetails = createAction({
  name: 'getDocumentDetails',
  displayName: 'Get Document Details',
  description:
    'Retrieve comprehensive document data including recipients, fields, pricing, and metadata for dashboards or audits',
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
