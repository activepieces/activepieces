import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { icemortgageEncompassAuth } from '../common/auth';
import { getAccessToken } from '../common/helpers';

export const listDocuments = createAction({
  name: 'document_list',
  auth: icemortgageEncompassAuth,
  displayName: 'Document - List',
  description: 'Retrieve all documents for a loan',
  props: {
    loanId: Property.ShortText({
      displayName: 'Loan ID',
      description: 'The ID of the loan',
      required: true,
    }),
    view: Property.StaticDropdown({
      displayName: 'View',
      description: 'The level of detail to return',
      required: false,
      options: {
        options: [
          { label: 'Detail (Default)', value: 'Detail' },
          { label: 'Full', value: 'Full' },
          { label: 'Summary', value: 'Summary' },
        ],
      },
      defaultValue: 'Detail',
    }),
    includeRemoved: Property.Checkbox({
      displayName: 'Include Removed Documents',
      description: 'Whether to include removed documents in the results',
      required: false,
      defaultValue: false,
    }),
    requireActiveAttachments: Property.Checkbox({
      displayName: 'Require Active Attachments',
      description: 'Whether to only return documents with active attachments',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const { loanId, view, includeRemoved, requireActiveAttachments } = context.propsValue;

    const accessToken = await getAccessToken(auth);

    const queryParams = new URLSearchParams();
    if (view) queryParams.append('view', view);
    if (includeRemoved) queryParams.append('includeRemoved', 'true');
    if (requireActiveAttachments) queryParams.append('requireActiveAttachments', 'true');

    const url = `${baseUrl}/encompass/v3/loans/${loanId}/documents${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.body;
  },
});
