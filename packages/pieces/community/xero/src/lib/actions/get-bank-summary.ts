import { createAction, Property } from '@activepieces/pieces-framework';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { xeroInput } from '../common/client';
import { xeroReports } from '../common/reports';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroGetBankSummary = createAction({
  auth: xeroAuth,
  name: 'xero_get_bank_summary',
  classification: 'READ',
  displayName: 'Get Bank Summary',
  description: 'Runs the Bank Summary report: opening balance, cash in, cash out and closing balance per bank account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs the Bank Summary report for a date range (defaults to the current month): one row per bank account with opening balance, cash received, cash spent and closing balance. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.report,
  props: {
    tenant_id: props.tenant_id,
    from_date: Property.ShortText({ displayName: 'From Date (YYYY-MM-DD)', required: false }),
    to_date: Property.ShortText({ displayName: 'To Date (YYYY-MM-DD)', required: false }),
  },
  async run(context) {
    const values = context.propsValue;
    const params = {
      fromDate: xeroInput.parseDateInput({ value: values.from_date, field: 'From Date' }),
      toDate: xeroInput.parseDateInput({ value: values.to_date, field: 'To Date' }),
    };
    return xeroReports.fetchReport({
      accessToken: context.auth.access_token,
      tenantId: values.tenant_id,
      report: 'BankSummary',
      queryParams: xeroReports.definedParams({ params }),
    });
  },
});
