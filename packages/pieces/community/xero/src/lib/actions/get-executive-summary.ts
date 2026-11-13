import { createAction, Property } from '@activepieces/pieces-framework';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { xeroInput } from '../common/client';
import { xeroReports } from '../common/reports';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroGetExecutiveSummary = createAction({
  auth: xeroAuth,
  name: 'xero_get_executive_summary',
  classification: 'READ',
  displayName: 'Get Executive Summary',
  description: 'Runs the Executive Summary report: cash, profitability, balance sheet and performance ratios for a month.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs the Executive Summary report for the month containing a date (defaults to the current month), comparing it with the previous month: cash, income, expenses, receivables, payables and ratios. Needs a connection created with Xero piece 0.8.0 or later. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.report,
  props: {
    tenant_id: props.tenant_id,
    date: Property.ShortText({ displayName: 'Month Date (YYYY-MM-DD)', description: 'Any date in the month to report on.', required: false }),
  },
  async run(context) {
    const values = context.propsValue;
    const params = {
      date: xeroInput.parseDateInput({ value: values.date, field: 'Month Date' }),
    };
    return xeroReports.fetchReport({
      accessToken: context.auth.access_token,
      tenantId: values.tenant_id,
      report: 'ExecutiveSummary',
      queryParams: xeroReports.definedParams({ params }),
    });
  },
});
