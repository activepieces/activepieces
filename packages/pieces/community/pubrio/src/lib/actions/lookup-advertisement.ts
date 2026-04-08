import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pubrioAuth } from '../../index';
import { pubrioRequest } from '../common';

export const lookupAdvertisement = createAction({
  auth: pubrioAuth,
  name: 'lookup_advertisement',
  displayName: 'Lookup Advertisement',
  description:
    'Look up detailed advertisement information by advertisement search ID',
  props: {
    advertisement_search_id: Property.ShortText({
      displayName: 'Advertisement Search ID',
      required: true,
      description: 'The advertisement search ID to look up',
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      advertisement_search_id: context.propsValue.advertisement_search_id,
    };
    return await pubrioRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/companies/advertisements/lookup',
      body
    );
  },
});
