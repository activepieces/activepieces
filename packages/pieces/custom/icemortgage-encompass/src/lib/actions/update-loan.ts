import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { icemortgageEncompassAuth } from '../common/auth';
import { getAccessToken } from '../common/helpers';

export const updateLoan = createAction({
  name: 'loan_update',
  auth: icemortgageEncompassAuth,
  displayName: 'Loan - Update',
  description: 'Update an existing loan in Encompass',
  props: {
    loanId: Property.ShortText({
      displayName: 'Loan ID',
      description: 'The ID of the loan to update',
      required: true,
    }),
    loanData: Property.Json({
      displayName: 'Loan Data',
      description: 'The loan fields to update as JSON object',
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
    templateType: Property.StaticDropdown({
      displayName: 'Template Type',
      description: 'Type of template to apply when updating the loan',
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
    ignoreEmptyClosingCostValues: Property.Checkbox({
      displayName: 'Ignore Empty Closing Cost Values',
      description: 'Whether to ignore empty closing cost values when applying templates',
      required: false,
      defaultValue: false,
    }),
    ignoreEmptyLoanProgramValues: Property.Checkbox({
      displayName: 'Ignore Empty Loan Program Values',
      description: 'Whether to ignore empty loan program values when applying templates',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const auth = context.auth as any;
    const baseUrl = auth.baseUrl;
    const {
      loanId,
      loanData,
      view,
      templateType,
      templatePath,
      ignoreEmptyClosingCostValues,
      ignoreEmptyLoanProgramValues,
    } = context.propsValue;

    const accessToken = await getAccessToken(auth);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (view) queryParams.append('view', view);
    if (templateType) queryParams.append('templateType', templateType);
    if (templatePath) queryParams.append('templatePath', templatePath);
    if (ignoreEmptyClosingCostValues) queryParams.append('ignoreEmptyClosingCostValues', 'true');
    if (ignoreEmptyLoanProgramValues) queryParams.append('ignoreEmptyLoanProgramValues', 'true');

    const url = `${baseUrl}/encompass/v3/loans/${loanId}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: loanData,
    });

    return response.body;
  },
});
