import { createAction, Property } from '@activepieces/pieces-framework';
import { bokioAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createAJournalEntry = createAction({
  auth: bokioAuth,
  name: 'createAJournalEntry',
  displayName: 'Create a journal entry',
  description: 'Creates a new journal entry in Bokio',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the journal entry',
      required: false,
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Journal entry date (YYYY-MM-DD)',
      required: true,
    }),
    items: Property.Array({
      displayName: 'Items (JSON)',
      description:
        'Journal entry items as JSON array. Each item should have: account (account number), debit (optional), credit (optional)',
      required: false,
      properties: {
        account: Property.Number({
          displayName: 'Account Number',
          description: 'Account number for the journal entry item',
          required: false,
        }),
        debit: Property.Number({
          displayName: 'Debit Amount',
          description: 'Debit amount for the journal entry item',
          required: false,
        }),
        credit: Property.Number({
          displayName: 'Credit Amount',
          description: 'Credit amount for the journal entry item',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const { title, date, items } = context.propsValue;
    const { api_key, companyId } = context.auth.props;

    const body: any = {
      date,
    };

    if (title) {
      body.title = title;
    }
    if (items) {
      body.items = items;
    }

    const response = await makeRequest(
      api_key,
      HttpMethod.POST,
      `/companies/${companyId}/journal-entries`,
      body
    );

    return response;
  },
});
