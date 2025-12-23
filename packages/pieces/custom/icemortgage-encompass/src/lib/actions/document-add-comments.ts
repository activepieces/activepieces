import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { icemortgageEncompassAuth } from '../common/auth';
import { getAccessToken } from '../common/helpers';

export const addDocumentComments = createAction({
  name: 'document_add_comments',
  auth: icemortgageEncompassAuth,
  displayName: 'Document - Add Comments',
  description: 'Add comments to a document',
  props: {
    loanId: Property.ShortText({
      displayName: 'Loan ID',
      description: 'The ID of the loan',
      required: true,
    }),
    documentId: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to add comments to',
      required: true,
    }),
    comments: Property.Array({
      displayName: 'Comments',
      description: 'Array of comment objects to add',
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
    const { loanId, documentId, comments, view } = context.propsValue;

    const accessToken = await getAccessToken(auth);

    const queryParams = new URLSearchParams();
    queryParams.append('action', 'add');
    if (view) queryParams.append('view', view);

    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `${baseUrl}/encompass/v3/loans/${loanId}/documents/${documentId}/comments?${queryParams.toString()}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: comments,
    });

    return response.body;
  },
});
