import { createAction, Property } from '@activepieces/pieces-framework';
import { enrichlayerAuth } from '../../';
import { enrichlayerApiCall } from '../api';
import { ENDPOINTS } from '../common';

export const getCompanyIdLookup = createAction({
  name: 'get_company_id_lookup',
  auth: enrichlayerAuth,
  displayName: 'Look Up Company by Numeric ID',
  description:
    'Resolve the vanity ID of a company from its numeric ID (0 credits)',
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
      context.auth as string,
      ENDPOINTS.COMPANY_ID_LOOKUP,
      {
        id: context.propsValue.id,
      },
    );
  },
});
