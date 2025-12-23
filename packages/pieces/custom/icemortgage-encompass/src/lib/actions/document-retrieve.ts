import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { icemortgageEncompassAuth } from '../common/auth';
import { getAccessToken } from '../common/helpers';

export const retrieveDocument = createAction({
  name: 'document_retrieve',
  auth: icemortgageEncompassAuth,
  displayName: 'Document - Retrieve',
  description: 'Retrieve a single document from a loan',
  props: {
    loanId: Property.ShortText({
      displayName: 'Loan ID',
      description: 'The ID of the loan',
      required: true,
    }),
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const { loanId, documentId } = context.propsValue;

    const accessToken = await getAccessToken(auth);

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl}/encompass/v3/loans/${loanId}/documents/${documentId}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.body;
  },
});
