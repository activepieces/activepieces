import { createAction, Property } from '@activepieces/pieces-framework';
import { parseurAuth } from '../auth';
import { parseurApi } from '../common/api';
import { parseurProps } from '../common/props';
import { findDocumentOutputSchema } from '../output-schemas';

export const findDocumentAction = createAction({
  auth: parseurAuth,
  name: 'findDocument',
  outputSchema: findDocumentOutputSchema,
  classification: 'SEARCH',
  displayName: 'Find Document',
  description: 'Finds a document based on search param.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists documents within a given Parseur parser/mailbox, optionally filtered by a case-insensitive name search term; with an empty search it returns all documents in that mailbox. Use to look up a document ID before fetching or reprocessing it. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    parserId: parseurProps.parserId({ required: true }),
    search: Property.ShortText({
      displayName: 'Search',
      description:
        'The search term to filter documents by name. Case insensitive. If empty, all documents are returned.',
      required: false,
    }),
  },
  async run({ auth, propsValue: { parserId, search } }) {
    if (!parserId) {
      throw new Error('Parser ID is required');
    }
    return await parseurApi.listDocuments({
      auth,
      parserId: String(parserId),
      query: { search },
    });
  },
});
