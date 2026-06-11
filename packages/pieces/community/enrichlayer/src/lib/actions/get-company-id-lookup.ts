import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerApiCall } from '../common/client';
import { ENDPOINTS } from '../common/constants';
import { enrichlayerAuth } from '../auth';

export const getCompanyIdLookup = createAction({
  name: 'get_company_id_lookup',
  auth: enrichlayerAuth,
  displayName: 'Look Up Company by Numeric ID',
  description:
    'Resolve the vanity ID of a company from its numeric ID (0 credits)',
  audience: 'both',
  aiMetadata: {
    description:
      "Resolve a company's vanity (public) identifier from its internal immutable numeric ID. Read-only, free, and safe to retry. Use only when you have the numeric company ID and need the vanity URL slug; to find a company by name or domain use Look Up Company instead.",
    idempotent: true,
  },
  props: {
    id: Property.ShortText({
      displayName: 'Numeric Company ID',
      description:
        "The company's internal, immutable numeric ID (e.g., 1441 for Google)",
      required: true,
    }),
  },
  async run(context) {
    return await enrichlayerApiCall(
      context.auth.secret_text as string,
      ENDPOINTS.COMPANY_ID_LOOKUP,
      {
        id: context.propsValue.id,
      },
    );
  },
});
