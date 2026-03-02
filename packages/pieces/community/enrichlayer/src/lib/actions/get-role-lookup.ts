import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getRoleLookup = createAction({
  name: 'get_role_lookup',
  auth: enrichlayerAuth,
  displayName: 'Look Up Role at Company',
  description:
    'Find the person who most closely matches a specified role at a company (3 credits)',
  props: {
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Name of the company (e.g., enrichlayer)',
      required: true,
    }),
    role: Property.ShortText({
      displayName: 'Role',
      description: 'Role to look up (e.g., ceo, cto, vp of engineering)',
      required: true,
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
      ENDPOINTS.ROLE_LOOKUP,
      {
        company_name: context.propsValue.company_name,
        role: context.propsValue.role,
        enrich_profile: context.propsValue.enrich_profile,
      },
    );
  },
});
