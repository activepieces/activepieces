import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { icemortgageEncompassAuth } from '../common/auth';
import { getAccessToken } from '../common/helpers';

export const updateDocument = createAction({
  name: 'document_update',
  auth: icemortgageEncompassAuth,
  displayName: 'Document - Update',
  description: 'Update an existing document on a loan',
  props: {
    loanId: Property.ShortText({
      displayName: 'Loan ID',
      description: 'The ID of the loan',
      required: true,
    }),
    documents: Property.Array({
      displayName: 'Documents',
      description: 'Array of document objects to update (must include id field for each)',
      required: true,
    }),
    view: Property.StaticDropdown({
      displayName: 'View',
      description: 'The view to return in the response',
      required: false,
      options: {
        options: [
          { label: 'Entity', value: 'entity' },
          { label: 'ID', value: 'id' },
        ],
      },
      defaultValue: 'entity',
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const { loanId, documents, view } = context.propsValue;

    const accessToken = await getAccessToken(auth);

    const queryParams = new URLSearchParams();
    queryParams.append('action', 'update');
    if (view) queryParams.append('view', view);

    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `${baseUrl}/encompass/v3/loans/${loanId}/documents?${queryParams.toString()}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: documents,
    });

    return response.body;
  },
});
