import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pinterestAuth } from '../common/auth';

export const findPinByTitleAction = createAction({
  name: 'find_pin_by_title',
  displayName: 'Find Pin by Title/Keyword',
  description: 'Search for pins by matching keywords in title, description, or alt text.',
  auth: pinterestAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Title, description, or keyword to search for.',
      required: true,
    }),
    ad_account_id: Property.ShortText({
      displayName: 'Ad Account ID (optional)',
      required: false,
    }),
    page_size: Property.Number({
      displayName: 'Results Limit',
      description: 'Max number of pins to return (1-250)',
      required: false,
      defaultValue: 25,
    }),
  },
  async run(context) {
    const { query, ad_account_id, page_size } = context.propsValue;

    const queryParams = new URLSearchParams();
    if (ad_account_id) queryParams.append('ad_account_id', ad_account_id);
    if (page_size) queryParams.append('page_size', page_size.toString());

    const url = `https://api.pinterest.com/v5/pins?${queryParams.toString()}`;

    const response = await httpClient.sendRequest<{ items: any[] }>({
      method: HttpMethod.GET,
      url,
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const pins = response.body.items;

    const matches = pins.filter((pin) => {
      const lowerQuery = query.toLowerCase();
      return (
        (pin.title && pin.title.toLowerCase().includes(lowerQuery)) ||
        (pin.description && pin.description.toLowerCase().includes(lowerQuery)) ||
        (pin.alt_text && pin.alt_text.toLowerCase().includes(lowerQuery)) ||
        (pin.note && pin.note.toLowerCase().includes(lowerQuery))
      );
    });

    return {
      total: matches.length,
      matches,
    };
  },
});
