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
    const query = propsValue['query'];
    const board_id = propsValue['board_id'];
    const bookmark = propsValue['bookmark'];
    const path = '/pins';
    const params: Record<string, string> = {};
    if (query) params['query'] = query;
    if (board_id) params['board_id'] = board_id;
    if (bookmark) params['bookmark'] = bookmark;
    const queryString =
      Object.keys(params).length > 0
        ? '?' + new URLSearchParams(params).toString()
        : '';
    return await makeRequest(
      auth as string,
      HttpMethod.GET,
      `${path}${queryString}`
    );
  },
});
