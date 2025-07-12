import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { boardIdDropdown } from '../common/props';

export const findPin = createAction({
  auth: pinterestAuth,
  name: 'findPin',
  displayName: 'Find Pin',
  description: 'Search for Pins using a title, description, or tag.',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      required: false,
      description: 'Title, description, or tag to search for.',
    }),
    board_id: boardIdDropdown,
    bookmark: Property.ShortText({
      displayName: 'Bookmark',
      required: false,
      description: 'Pagination bookmark from previous response.',
    }),
  },
  async run({ auth, propsValue }) {
    const query = propsValue.query;

    const path = '/pins';
    const response = await makeRequest(
      auth.access_token as string,
      HttpMethod.GET,
      `${path}`
    );

    // If no query is provided, return all pins
    if (!query) {
      return response;
    }

    // Filter pins based on the query
    const filteredPins = response.items.filter((pin: any) => {
      const searchText = query.toLowerCase();
      const title = (pin.title || '').toLowerCase();
      const description = (pin.description || '').toLowerCase();
      const note = (pin.note || '').toLowerCase();

      return (
        title.includes(searchText) ||
        description.includes(searchText) ||
        note.includes(searchText)
      );
    });

    return {
      items: filteredPins,
      bookmark: response.bookmark,
    };
  },
});
