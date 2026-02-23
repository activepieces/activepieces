import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getCompanyProfile = createAction({
  name: 'get_company_profile',
  auth: enrichlayerAuth,
  displayName: 'Get Company Profile',
  description:
    'Get structured data of a Company Profile from a professional network URL (1 credit)',
  props: {
    url: Property.ShortText({
      displayName: 'Company URL',
      description:
        'Professional network company URL to enrich (e.g., https://www.linkedin.com/company/google/)',
      required: true,
    }),
    categories: Property.StaticDropdown({
      displayName: 'Include Categories',
      description: 'Append category data for this company (+1 credit)',
      required: false,
      options: {
        options: [
          { label: 'Exclude (default)', value: 'exclude' },
          { label: 'Include (+1 credit)', value: 'include' },
        ],
      },
    }),
    funding_data: Property.StaticDropdown({
      displayName: 'Include Funding Data',
      description: 'Return a list of funding rounds (+1 credit)',
      required: false,
      options: {
        options: [
          { label: 'Exclude (default)', value: 'exclude' },
          { label: 'Include (+1 credit)', value: 'include' },
        ],
      },
    }),
    exit_data: Property.StaticDropdown({
      displayName: 'Include Exit Data',
      description: 'Return investment portfolio exits (+1 credit)',
      required: false,
      options: {
        options: [
          { label: 'Exclude (default)', value: 'exclude' },
          { label: 'Include (+1 credit)', value: 'include' },
        ],
      },
    }),
    acquisitions: Property.StaticDropdown({
      displayName: 'Include Acquisitions',
      description: 'Return enriched acquisition data (+1 credit)',
      required: false,
      options: {
        options: [
          { label: 'Exclude (default)', value: 'exclude' },
          { label: 'Include (+1 credit)', value: 'include' },
        ],
      },
    }),
    extra: Property.StaticDropdown({
      displayName: 'Include Extra Data',
      description:
        'Enrich with Crunchbase ranking, contact info, social accounts, funding details, IPO status (+1 credit)',
      required: false,
      options: {
        options: [
          { label: 'Exclude (default)', value: 'exclude' },
          { label: 'Include (+1 credit)', value: 'include' },
        ],
      },
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
    fallback_to_cache: Property.StaticDropdown({
      displayName: 'Fallback to Cache',
      description: 'Fallback behavior if fetching a fresh profile fails',
      required: false,
      options: {
        options: [
          { label: 'On Error (default)', value: 'on-error' },
          { label: 'Never', value: 'never' },
        ],
      },
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth as string,
      ENDPOINTS.COMPANY_PROFILE,
      {
        url: context.propsValue.url,
        categories: context.propsValue.categories,
        funding_data: context.propsValue.funding_data,
        exit_data: context.propsValue.exit_data,
        acquisitions: context.propsValue.acquisitions,
        extra: context.propsValue.extra,
        use_cache: context.propsValue.use_cache,
        fallback_to_cache: context.propsValue.fallback_to_cache,
      },
    );
  },
});
