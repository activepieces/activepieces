import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzFormat } from '../common/format';
import { reviewflowzProps } from '../common/props';
import { reviewflowzSearch } from '../common/search';

export const findSourceAction = createAction({
  auth: reviewflowzAuth,
  name: 'find_source',
  classification: 'SEARCH',
  displayName: 'Find Source',
  description: 'Finds a source (a listing we collect reviews from) by name or website.',
  audience: 'both',
  aiMetadata: {
    description:
      'Find a Reviewflowz source (a review listing being tracked) by name, website domain and platform. Returns found: false when none matches. Read-only.',
    idempotent: true,
  },
  props: {
    q: Property.ShortText({ displayName: 'Name', required: false }),
    domain: Property.ShortText({ displayName: 'Website domain', description: 'Like toureiffel.paris.', required: false }),
    platform: reviewflowzProps.optionalPlatform(),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    const rows = await reviewflowzSearch.list({
      auth,
      path: '/sources',
      query: { limit: 1, q: input.q, domain: input.domain, platform: input.platform },
    });
    return reviewflowzSearch.first(
      rows.map((source) => ({
        ...source,
        platform_name: reviewflowzFormat.platformName(typeof source['platform'] === 'string' ? source['platform'] : undefined),
      })),
    );
  },
});
