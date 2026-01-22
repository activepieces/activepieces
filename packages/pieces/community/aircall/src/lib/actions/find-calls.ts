import { createAction, Property } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { tagIdDropdown } from '../common/props';

export const findCalls = createAction({
  auth: aircallAuth,
  name: 'findCalls',
  displayName: 'Find Call',
  description: 'Finds specific call based on provided filter.',
  props: {
    direction: Property.StaticDropdown({
      displayName: 'Call Direction',
      description: 'Filter by call direction',
      required: false,
      options: {
        options: [
          { label: 'Inbound', value: 'inbound' },
          { label: 'Outbound', value: 'outbound' },
        ],
      },
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The calling or receiving phone number of calls.',
      required: false,
    }),
    tags: tagIdDropdown,
  },
  async run(context) {
    const { direction, phone_number, tags } = context.propsValue;

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.set('order', 'desc');
    queryParams.set('fetch_contact', 'true');
    queryParams.set('fetch_short_urls', 'true');

    if (direction) queryParams.set('direction', direction);
    if (phone_number) queryParams.set('phone_number', phone_number);

    if (tags && tags.length > 0) {
      tags.forEach((tagId) => queryParams.append('tags[]', tagId.toString()));
    }

    const queryString = queryParams.toString();
    const path = `/calls/search${queryString ? `?${queryString}` : ''}`;

    const response = await makeRequest(context.auth, HttpMethod.GET, path);

    const { calls } = response as { calls: { id: number }[] };

    return {
      found: calls.length > 0,
      data: calls.length > 0 ? calls[0] : {},
    };
  },
});
