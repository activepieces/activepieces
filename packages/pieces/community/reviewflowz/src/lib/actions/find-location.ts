import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzSearch } from '../common/search';

export const findLocationAction = createAction({
  auth: reviewflowzAuth,
  name: 'find_location',
  classification: 'SEARCH',
  displayName: 'Find Location',
  description: 'Finds a location by name.',
  audience: 'both',
  aiMetadata: {
    description: 'Find a Reviewflowz location by its exact name (case does not matter). Returns found: false when none matches. Read-only.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    const rows = await reviewflowzSearch.list({ auth, path: '/locations', query: { q: input.name, limit: 10 } });
    return reviewflowzSearch.first(rows.filter((row) => reviewflowzSearch.sameName({ row, name: input.name })));
  },
});
