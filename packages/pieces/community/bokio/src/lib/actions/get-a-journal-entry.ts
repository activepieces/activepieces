import { createAction, Property } from '@activepieces/pieces-framework';
import { bokioAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getAJournalEntry = createAction({
  auth: bokioAuth,
  name: 'getAJournalEntry',
  displayName: 'Get a journal entry',
  description: 'Retrieve a specific journal entry by its ID',
  props: {
    journalEntryId: Property.ShortText({
      displayName: 'Journal Entry ID',
      description: 'UUID of the journal entry',
      required: true,
    }),
  },
  async run(context) {
    const { journalEntryId } = context.propsValue;
    const { api_key, companyId } = context.auth.props;

    const response = await makeRequest(
      api_key,
      HttpMethod.GET,
      `/companies/${companyId}/journal-entries/${journalEntryId}`
    );

    return response;
  },
});
