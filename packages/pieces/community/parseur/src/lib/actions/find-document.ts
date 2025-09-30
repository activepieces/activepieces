import { createAction, Property } from '@activepieces/pieces-framework';
import { parseurAuth, parseurCommon } from '../common';
import { parserDropdown } from '../common/properties';

export const findDocument = createAction({
  auth: parseurAuth,
  name: 'findDocument',
  displayName: 'Find Document',
  description: 'Finds a document based on search param.',
  props: {
    parserId: parserDropdown({ required: true }),
    search: Property.ShortText({
      displayName: 'Search',
      description:
        'The search term to filter documents by name. Case insensitive. If empty, all documents are returned.',
      required: false,
    }),
  },
  async run({ auth: apiKey, propsValue: { parserId, search } }) {
    if (!parserId) {
      throw new Error('Parser ID is required');
    }
    return await parseurCommon.listDocuments({
      apiKey,
      parserId,
      search,
    });
  },
});
