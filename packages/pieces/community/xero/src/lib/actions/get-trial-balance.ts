import { createAction, Property } from '@activepieces/pieces-framework';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { xeroInput } from '../common/client';
import { xeroReports } from '../common/reports';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroGetTrialBalance = createAction({
  auth: xeroAuth,
  name: 'xero_get_trial_balance',
  classification: 'READ',
  displayName: 'Get Trial Balance',
  description: 'Runs the Trial Balance report as at a date.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs the Trial Balance report as at a date (defaults to today): one row per account with debit, credit and year-to-date columns. Needs a connection created with Xero piece 0.8.0 or later (trial balance permission). Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.report,
  props: {
    tenant_id: props.tenant_id,
    date: Property.ShortText({ displayName: 'As At Date (YYYY-MM-DD)', required: false }),
    payments_only: Property.Checkbox({ displayName: 'Cash Basis (Payments Only)', required: false }),
  },
  async run(context) {
    const values = context.propsValue;
    const params = {
      date: xeroInput.parseDateInput({ value: values.date, field: 'As At Date' }),
      paymentsOnly: values.payments_only,
    };
    return xeroReports.fetchReport({
      accessToken: context.auth.access_token,
      tenantId: values.tenant_id,
      report: 'TrialBalance',
      queryParams: xeroReports.definedParams({ params }),
    });
  },
});
