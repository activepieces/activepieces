import { createAction } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzProps } from '../common/props';
import { reviewflowzSearch } from '../common/search';

export const getRatingAction = createAction({
  auth: reviewflowzAuth,
  name: 'get_rating',
  classification: 'READ',
  displayName: 'Get Rating',
  description: "Gets a source's current rating and review count.",
  audience: 'both',
  aiMetadata: {
    description:
      "Get one Reviewflowz source's current rating and review count as the platform shows them. Use the Rating Changed trigger to be told when they move. Read-only.",
    idempotent: true,
  },
  props: {
    source: reviewflowzProps.source(),
  },
  async run(context) {
    return reviewflowzSearch.first(
      await reviewflowzSearch.list({
        auth: context.auth,
        path: '/ratings',
        query: { source: context.propsValue.source, limit: 1 },
      }),
    );
  },
});
