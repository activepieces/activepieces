import { createAction, Property } from '@activepieces/pieces-framework';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { xeroInput } from '../common/client';
import { xeroReports } from '../common/reports';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroGetAgedPayables = createAction({
  auth: xeroAuth,
  name: 'xero_get_aged_payables',
  classification: 'READ',
  displayName: 'Get Aged Payables for Contact',
  description: 'Runs the Aged Payables report for one supplier: what you owe them, by bill and age.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs the Aged Payables by Contact report for one supplier ContactID: each outstanding bill with its amount due and how overdue it is. Needs a connection created with Xero piece 0.8.0 or later. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: xeroOutputSchemas.report,
  props: {
    tenant_id: props.tenant_id,
    contact_id: Property.ShortText({ displayName: 'Contact ID', description: 'The Xero ContactID (a GUID). Use Find Contact to get it.', required: true }),
    date: Property.ShortText({ displayName: 'Aged As At (YYYY-MM-DD)', description: 'Defaults to today.', required: false }),
    from_date: Property.ShortText({ displayName: 'Show Invoices From (YYYY-MM-DD)', required: false }),
    to_date: Property.ShortText({ displayName: 'Show Invoices To (YYYY-MM-DD)', required: false }),
  },
  async run(context) {
    const values = context.propsValue;
    const params = {
      contactId: xeroInput.requiredText({ value: values.contact_id, field: 'Contact ID' }),
      date: xeroInput.parseDateInput({ value: values.date, field: 'Aged As At' }),
      fromDate: xeroInput.parseDateInput({ value: values.from_date, field: 'Show Invoices From' }),
      toDate: xeroInput.parseDateInput({ value: values.to_date, field: 'Show Invoices To' }),
    };
    return xeroReports.fetchReport({
      accessToken: context.auth.access_token,
      tenantId: values.tenant_id,
      report: 'AgedPayablesByContact',
      queryParams: xeroReports.definedParams({ params }),
    });
  },
});
