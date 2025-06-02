import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pandadocAuth } from '../../index';
import { documentDropdown } from '../common/utils';
interface PandaDocDocument {
  id: string;
  name: string;
  status: string;
  date_created: string;
  date_modified: string;
}

interface PandaDocDocumentResponse {
  results: PandaDocDocument[];
  count: number;
}
export const getDocumentDetails = createAction({
  auth: pandadocAuth,
  name: 'getDocumentDetails',
  displayName: 'Get Document Details',
  description:
    'Retrieve detailed information about a document including recipients, fields, tokens, pricing, and metadata',
  props: {
    documentId: documentDropdown,
  },
  async run(context) {
    const { documentId } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.pandadoc.com/public/v1/documents/${documentId}/details`,
      headers: {
        Authorization: `API-Key ${context.auth.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});
