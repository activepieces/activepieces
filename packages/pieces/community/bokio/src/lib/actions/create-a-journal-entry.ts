import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioAuth } from '../common/auth';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';

export const createAJournalEntry = createAction({
  auth: bokioAuth,
  name: 'createAJournalEntry',
  classification: 'WRITE',
  displayName: 'Create a journal entry',
  description: 'Creates a new journal entry in Bokio',
  audience: 'human',
  aiMetadata: {
    description:
      'Posts a balanced journal entry (debits equal credits) in a Bokio company. Not idempotent: each call posts another entry.',
    idempotent: false,
  },
  outputSchema: bokioSchemas.journalEntry,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the journal entry',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Journal entry date (YYYY-MM-DD)',
      required: true,
    }),
    items: Property.Array({
      displayName: 'Lines',
      description:
        'At least two lines. Each line has an account number and either a debit or a credit amount. Total debits must equal total credits.',
      required: true,
      properties: {
        account: Property.Number({
          displayName: 'Account Number',
          placeholder: '1930',
          description: 'Bokio account number, for example 1930',
          required: true,
        }),
        debit: Property.Number({
          displayName: 'Debit Amount',
          description: 'Debit amount (leave empty for a credit line)',
          required: false,
        }),
        credit: Property.Number({
          displayName: 'Credit Amount',
          description: 'Credit amount (leave empty for a debit line)',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const { title, date, items } = context.propsValue;
    const body = bokioBuilders.buildJournalBody({ title, date, lines: items ?? [] });
    return bokioClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/journal-entries',
      operation: 'create journal entry',
      body,
    });
  },
});
