import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzSearch } from '../common/search';

export const findTagAction = createAction({
  auth: reviewflowzAuth,
  name: 'find_tag',
  classification: 'SEARCH',
  displayName: 'Find Tag',
  description: 'Finds a tag by name.',
  audience: 'both',
  aiMetadata: {
    description: 'Find a Reviewflowz review tag by its exact name (case does not matter). Returns found: false when none matches. Read-only.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    const rows = await reviewflowzSearch.list({ auth, path: '/tags', query: { q: input.name } });
    return reviewflowzSearch.first(rows.filter((row) => reviewflowzSearch.sameName({ row, name: input.name })));
  },
});
