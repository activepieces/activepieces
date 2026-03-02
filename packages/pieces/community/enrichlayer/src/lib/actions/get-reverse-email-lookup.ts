import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getReverseEmailLookup = createAction({
  name: 'get_reverse_email_lookup',
  auth: enrichlayerAuth,
  displayName: 'Reverse Email Lookup',
  description:
    'Find social media profiles from an email address. Works with both personal and work emails (3 credits)',
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description:
        'Email address to look up (e.g., johndoe@enrichlayer.com)',
      required: true,
    }),
    lookup_depth: Property.StaticDropdown({
      displayName: 'Lookup Depth',
      description:
        'Superficial: no credits if no results. Deep: credits used regardless.',
      required: false,
      options: {
        options: [
          { label: 'Deep (default)', value: 'deep' },
          {
            label: 'Superficial (no credits if no results)',
            value: 'superficial',
          },
        ],
      },
    }),
    enrich_profile: Property.StaticDropdown({
      displayName: 'Enrich Profile',
      description:
        'Enrich the result with cached profile data (+1 credit)',
      required: false,
      options: {
        options: [
          { label: 'Skip (default)', value: 'skip' },
          { label: 'Enrich (+1 credit)', value: 'enrich' },
        ],
      },
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth as string,
      ENDPOINTS.REVERSE_EMAIL_LOOKUP,
      {
        email: context.propsValue.email,
        lookup_depth: context.propsValue.lookup_depth,
        enrich_profile: context.propsValue.enrich_profile,
      },
    );
  },
});
