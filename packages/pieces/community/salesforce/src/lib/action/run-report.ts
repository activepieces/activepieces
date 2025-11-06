import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { salesforceAuth } from '../..';
import { callSalesforceApi, salesforcesCommon } from '../common';

export const runReport = createAction({
    auth: salesforceAuth,
    name: 'run_report',
    displayName: 'Run Report',
    description: 'Execute a Salesforce analytics report.',
    props: {
        report_id: salesforcesCommon.report,
        filters: Property.Json({
            displayName: 'Filters',
            description: 'Apply dynamic filters to the report run.',
            required: false,
            defaultValue: [
                {
                    "column": "ACCOUNT.NAME",
                    "operator": "equals",
                    "value": "Acme"
                }
            ]
        })
    },
    async run(context) {
        const { report_id, filters } = context.propsValue;

        let body = undefined;
        if (filters && Array.isArray(filters) && filters.length > 0) {
            body = {
                reportMetadata: {
                    reportFilters: filters,
                },
            };
        }

        const response = await callSalesforceApi(
            HttpMethod.POST,
            context.auth,
            `/services/data/v56.0/analytics/reports/${report_id}`,
            body
        );

        return response.body;
    },
});