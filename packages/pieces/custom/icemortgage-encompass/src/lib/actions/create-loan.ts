import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { icemortgageEncompassAuth } from '../common/auth';
import { getAccessToken } from '../common/helpers';

export const createLoan = createAction({
  name: 'loan_create',
  auth: icemortgageEncompassAuth,
  displayName: 'Loan - Create',
  description: 'Create a new loan in Encompass',
  props: {
    loanData: Property.Json({
      displayName: 'Loan Data',
      description: 'The complete loan information as JSON object',
      required: true,
    }),
    loanFolder: Property.ShortText({
      displayName: 'Loan Folder',
      description: 'The folder where the loan will be created (e.g., "My Pipeline")',
      required: false,
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
    templateType: Property.StaticDropdown({
      displayName: 'Template Type',
      description: 'Type of template to apply when creating the loan',
      required: false,
      options: {
        options: [
          { label: 'None', value: '' },
          { label: 'Template Set', value: 'templateSet' },
          { label: 'Loan Program', value: 'loanProgram' },
          { label: 'Closing Cost', value: 'closingCost' },
        ],
      },
    }),
    templatePath: Property.ShortText({
      displayName: 'Template Path',
      description: 'Path to the template (e.g., "Public:\\Companywide\\Template Name")',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const { loanData, loanFolder, view, templateType, templatePath } = context.propsValue;

    // Get access token
    const accessToken = await getAccessToken(auth);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (loanFolder) queryParams.append('loanFolder', loanFolder);
    if (view) queryParams.append('view', view);
    if (templateType) queryParams.append('templateType', templateType);
    if (templatePath) queryParams.append('templatePath', templatePath);

    const url = `${baseUrl}/encompass/v3/loans${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: loanData,
    });

    // Extract loan ID from Location header if present
    const locationHeader = response.headers?.['location'] as string;
    let loanId = null;
    if (locationHeader) {
      const match = locationHeader.match(/\/loans\/([^\/]+)$/);
      if (match) {
        loanId = match[1];
      }
    }

    return {
      loanId,
      loanData: response.body,
      statusCode: response.status,
    };
  },
});
