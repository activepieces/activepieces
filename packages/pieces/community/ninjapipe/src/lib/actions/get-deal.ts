import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon } from '../common';

export const getDeal = createAction({
  auth: ninjapipeAuth,
  name: 'get_deal',
  displayName: 'Get Deal',
  description: 'Retrieves a deal by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetches a single deal by its ID, returning its full record. Pick this when you already have a deal ID and need its details; use List Deals instead to search or browse. Read-only and safe to repeat.', idempotent: true },
  props: {
    dealId: ninjapipeCommon.dealDropdownRequired,
  },
  async run(context) {
    const auth = getAuth(context);
    const response = await ninjapipeApiCall<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: `/deals/${encodeURIComponent(String(context.propsValue.dealId))}` });
    return flattenCustomFields(response.body);
  },
});
