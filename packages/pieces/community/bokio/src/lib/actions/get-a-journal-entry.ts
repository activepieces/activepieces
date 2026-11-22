import { createAction, Property } from '@activepieces/pieces-framework';
import { bokioAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';

export const getAJournalEntry = createAction({
  auth: bokioAuth,
  name: 'getAJournalEntry',
  classification: 'READ',
  displayName: 'Get a journal entry',
  description: 'Retrieve a specific journal entry by its ID',
  audience: 'both',
  aiMetadata: { description: 'Retrieves a single journal entry from a Bokio company by its UUID. Use when you already have the journal entry ID and need its full bookkeeping details. Idempotent read-only lookup.', idempotent: true },
  outputSchema: bokioSchemas.journalEntry,
  props: {
    journalEntryId: Property.ShortText({
      displayName: 'Journal Entry ID',
      description: 'UUID of the journal entry',
      required: true,
    }),
  },
  async run(context) {
    const { journalEntryId } = context.propsValue;
    return bokioClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/journal-entries/${bokioBuilders.requireUuid({ value: journalEntryId, kind: 'journalEntry' })}`,
      operation: 'get journal entry',
    });
  },
});
