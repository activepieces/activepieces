import { Property, createAction } from '@activepieces/pieces-framework';
import { callSalesforceApi } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';

export const runReport = createAction({
  auth: salesforceAuth,
  name: 'run_report',
  displayName: 'Run Report',
  description: 'Executes a Salesforce analytics report and returns the results',
  props: {
    reportId: Property.ShortText({
      displayName: 'Report ID',
      description: 'ID of the report to run (15 or 18 character ID)',
      required: true,
    }),
    includeDetails: Property.Checkbox({
      displayName: 'Include Details',
      description: 'Include detailed row-level data in the response',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { reportId, includeDetails } = context.propsValue;

    const detailsParam = includeDetails ? '?includeDetails=true' : '';
    
    const response = await callSalesforceApi(
      HttpMethod.POST,
      context.auth,
      `/services/data/v56.0/analytics/reports/${reportId}${detailsParam}`,
      {}
    );

    return response.body;
  },
});

