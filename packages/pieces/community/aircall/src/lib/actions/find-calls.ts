import { createAction, Property } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findCalls = createAction({
  auth: aircallAuth,
  name: 'findCalls',
  displayName: 'Find Calls',
  description:
    'Search for specific calls with filtering options (3 months history limit)',
  props: {
    from: Property.ShortText({
      displayName: 'From Date',
      description: 'Set a minimal creation date for calls (UNIX timestamp)',
      required: false,
    }),
    to: Property.ShortText({
      displayName: 'To Date',
      description: 'Set a maximal creation date for calls (UNIX timestamp)',
      required: false,
    }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      description: 'Reorder entries by created_at',
      required: false,
      defaultValue: 'asc',
      options: {
        options: [
          { label: 'Ascending (oldest first)', value: 'asc' },
          { label: 'Descending (newest first)', value: 'desc' },
        ],
      },
    }),
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
    user_id: Property.Number({
      displayName: 'User ID',
      description: 'Unique ID of the user who made or received calls',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The calling or receiving phone number of calls',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tag IDs',
      description:
        'Array of tag IDs (AND condition - calls must have all tags)',
      required: false,
      properties: {
        tagId: Property.Number({
          displayName: 'Tag ID',
          description: 'The unique identifier of the tag',
          required: true,
        }),
      },
    }),
    fetch_contact: Property.Checkbox({
      displayName: 'Fetch Contact Details',
      description: 'When enabled, includes contact details in the response',
      required: false,
      defaultValue: false,
    }),
    fetch_short_urls: Property.Checkbox({
      displayName: 'Fetch Short URLs',
      description: 'When enabled, includes short URLs in the response',
      required: false,
      defaultValue: false,
    }),
    fetch_call_timeline: Property.Checkbox({
      displayName: 'Fetch Call Timeline',
      description:
        'When enabled, includes IVR options selected in the response',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      from,
      to,
      order,
      direction,
      user_id,
      phone_number,
      tags,
      fetch_contact,
      fetch_short_urls,
      fetch_call_timeline,
    } = context.propsValue;
    

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);
    if (order) queryParams.set('order', order);
    if (direction) queryParams.set('direction', direction);
    if (user_id) queryParams.set('user_id', user_id.toString());
    if (phone_number) queryParams.set('phone_number', phone_number);

    if (tags && tags.length > 0) {
      const tagIds = tags.map((tag: any) => tag.tagId);
      tagIds.forEach((tagId) => queryParams.append('tags[]', tagId.toString()));
    }

    if (fetch_contact) queryParams.set('fetch_contact', 'true');
    if (fetch_short_urls) queryParams.set('fetch_short_urls', 'true');
    if (fetch_call_timeline) queryParams.set('fetch_call_timeline', 'true');

    const queryString = queryParams.toString();
    const path = `/calls/search${queryString ? `?${queryString}` : ''}`;

    const response = await makeRequest( context.auth, HttpMethod.GET, path);

    return {
      calls: response.calls,
    };
  },
});
