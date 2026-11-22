import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioAuth } from '../common/auth';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';

export const aiCreateJournalEntry = createAction({
  auth: bokioAuth,
  name: 'ai_create_journal_entry',
  classification: 'WRITE',
  displayName: 'Create Journal Entry',
  description: 'Posts a balanced journal entry in Bokio.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts a journal entry (verification) to the Bokio ledger and returns it with its id. title and date (YYYY-MM-DD) are required. lines is a JSON array string of at least two lines, each {"account": <whole account number from List Accounts>, "debit": <amount>} or {"account": <number>, "credit": <amount>}; total debits must equal total credits, for example [{"account":1930,"debit":125},{"account":3001,"credit":125}]. Bookkeeping is permanent: a posted entry can only be reversed, not deleted. Not idempotent: each call posts another entry.',
    idempotent: false,
  },
  outputSchema: bokioSchemas.journalEntry,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Journal entry title',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'YYYY-MM-DD',
      required: true,
    }),
    lines: Property.LongText({
      displayName: 'Lines (JSON)',
      description:
        'JSON array, e.g. [{"account":1930,"debit":125},{"account":3001,"credit":125}]. Debits must equal credits.',
      required: true,
    }),
  },
  async run(context) {
    const { title, date, lines } = context.propsValue;
    const body = bokioBuilders.buildJournalBody({ title, date, lines });
    return bokioClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: '/journal-entries',
      operation: 'create journal entry',
      body,
    });
  },
});
