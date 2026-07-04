import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../auth';
import { enrichlayerApiCall } from '../common/client';
import { ENDPOINTS } from '../common/constants';

export const getSchoolProfile = createAction({
  name: 'get_school_profile',
  auth: enrichlayerAuth,
  displayName: 'Get School Profile',
  description:
    'Get structured data of a School Profile from a professional network URL (1 credit)',
  audience: 'both',
  aiMetadata: {
    description:
      'Enrich a single school or university into structured profile data given its professional-network school URL. Pick this when you already have the school URL and need its details; read-only and idempotent. Use Live Fetch to force a fresh fetch instead of cached data at a higher credit cost.',
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'School URL',
      description:
        'Professional network school URL to enrich (e.g., https://www.linkedin.com/school/national-university-of-singapore)',
      required: true,
    }),
    use_cache: Property.StaticDropdown({
      displayName: 'Cache Strategy',
      description: 'Control how cached data is used',
      required: false,
      options: {
        options: [
          { label: 'If Present (default)', value: 'if-present' },
          { label: 'If Recent (+1 credit)', value: 'if-recent' },
        ],
      },
    }),
    live_fetch: Property.StaticDropdown({
      displayName: 'Live Fetch',
      description: 'Force a fresh profile fetch (+9 credits)',
      required: false,
      options: {
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Force (+9 credits)', value: 'force' },
        ],
      },
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth.secret_text as string,
      ENDPOINTS.SCHOOL_PROFILE,
      {
        url: context.propsValue.url,
        use_cache: context.propsValue.use_cache,
        live_fetch: context.propsValue.live_fetch,
      },
    );
  },
});
