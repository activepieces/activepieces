import { createAction, Property } from '@activepieces/pieces-framework';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { xeroInput } from '../common/client';
import { xeroReports } from '../common/reports';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroGetProfitAndLoss = createAction({
  auth: xeroAuth,
  name: 'xero_get_profit_and_loss',
  classification: 'READ',
  displayName: 'Get Profit and Loss',
  description: 'Runs the Profit and Loss report for a date range, with optional comparison periods.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs the Profit and Loss report for a date range (defaults to the current month) and returns it as flat rows with a section, a label and one value per column, optionally compared with earlier months, quarters or years. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.report,
  props: {
    tenant_id: props.tenant_id,
    from_date: Property.ShortText({ displayName: 'From Date (YYYY-MM-DD)', required: false }),
    to_date: Property.ShortText({ displayName: 'To Date (YYYY-MM-DD)', required: false }),
    timeframe: Property.StaticDropdown({
      displayName: 'Period Length',
      description: 'Length of each comparison period.',
      required: false,
      options: { options: [{ label: 'Month', value: 'MONTH' }, { label: 'Quarter', value: 'QUARTER' }, { label: 'Year', value: 'YEAR' }] },
    }),
    periods: Property.Number({ displayName: 'Comparison Periods', description: 'Number of earlier periods to compare with, 1 to 11.', required: false }),
    standard_layout: Property.Checkbox({ displayName: 'Standard Layout', description: 'Ignore custom report layouts.', required: false }),
    payments_only: Property.Checkbox({ displayName: 'Cash Basis (Payments Only)', required: false }),
  },
  async run(context) {
    const values = context.propsValue;
    const params = {
      fromDate: xeroInput.parseDateInput({ value: values.from_date, field: 'From Date' }),
      toDate: xeroInput.parseDateInput({ value: values.to_date, field: 'To Date' }),
      periods: xeroReports.periodsParam({ value: values.periods }),
      timeframe: values.timeframe,
      standardLayout: values.standard_layout,
      paymentsOnly: values.payments_only,
    };
    return xeroReports.fetchReport({
      accessToken: context.auth.access_token,
      tenantId: values.tenant_id,
      report: 'ProfitAndLoss',
      queryParams: xeroReports.definedParams({ params }),
    });
  },
});
