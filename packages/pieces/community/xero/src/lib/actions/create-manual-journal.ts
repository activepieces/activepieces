import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { XERO_URLS, xeroApi, xeroInput } from '../common/client';
import { aiInput } from '../common/ai-props';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroCreateManualJournal = createAction({
  auth: xeroAuth,
  name: 'xero_create_manual_journal',
  classification: 'WRITE',
  displayName: 'Create Manual Journal',
  description: 'Creates a manual journal with balanced debit and credit lines.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a manual journal from journal lines where positive LineAmount values are debits and negative values are credits; the lines must add up to exactly zero and are checked before anything is sent. Saved as DRAFT unless Status is POSTED. Not idempotent: each call creates another journal.',
    idempotent: false,
  },
  outputSchema: xeroOutputSchemas.manualJournal,
  props: {
    tenant_id: props.tenant_id,
    narration: Property.ShortText({ displayName: 'Narration', description: 'Description of the journal.', required: true }),
    journal_lines: Property.Json({
      displayName: 'Journal Lines',
      description:
        'JSON array of lines, e.g. [{"LineAmount":100,"AccountCode":"400","Description":"Accrual"},{"LineAmount":-100,"AccountCode":"800"}]. Positive amounts are debits, negative are credits, and the total must be 0. Allowed keys: LineAmount, AccountCode, AccountID, Description, TaxType, TaxAmount, Tracking.',
      required: true,
    }),
    date: Property.ShortText({ displayName: 'Date (YYYY-MM-DD)', description: 'Defaults to today in Xero.', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'DRAFT',
      options: { options: [{ label: 'Draft', value: 'DRAFT' }, { label: 'Posted', value: 'POSTED' }] },
    }),
    line_amount_types: Property.StaticDropdown({
      displayName: 'Line Amount Types',
      required: false,
      options: {
        options: [
          { label: 'Tax exclusive', value: 'Exclusive' },
          { label: 'Tax inclusive', value: 'Inclusive' },
          { label: 'No tax', value: 'NoTax' },
        ],
      },
    }),
    show_on_cash_basis_reports: Property.Checkbox({ displayName: 'Show on Cash Basis Reports', required: false }),
  },
  async run(context) {
    const values = context.propsValue;
    const narration = xeroInput.requiredText({ value: values.narration, field: 'Narration' });
    const journalLines = aiInput.parseJournalLines({ value: values.journal_lines });
    const date = xeroInput.parseDateInput({ value: values.date, field: 'Date' });
    const body = await xeroApi.request<unknown>({
      accessToken: context.auth.access_token,
      tenantId: values.tenant_id,
      method: HttpMethod.PUT,
      url: `${XERO_URLS.api}/ManualJournals`,
      body: {
        ManualJournals: [
          {
            Narration: narration,
            JournalLines: journalLines,
            ...(date ? { Date: date } : {}),
            ...(values.status ? { Status: values.status } : {}),
            ...(values.line_amount_types ? { LineAmountTypes: values.line_amount_types } : {}),
            ...(typeof values.show_on_cash_basis_reports === 'boolean' ? { ShowOnCashBasisReports: values.show_on_cash_basis_reports } : {}),
          },
        ],
      },
      operation: 'create manual journal',
    });
    return xeroApi.firstRecord({ body, key: 'ManualJournals', operation: 'create manual journal' });
  },
});
