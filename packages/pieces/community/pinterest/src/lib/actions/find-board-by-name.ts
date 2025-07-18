import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { adAccountIdDropdown } from '../common/props';

export const findBoardByName = createAction({
  auth: pinterestAuth,
  name: 'findBoardByName',
  displayName: 'Find Board by Name',
  description: 'Locate a board by its name for pinning or updates.',
  props: {
    name_search: Property.ShortText({
      displayName: 'Board Name',
      required: true,
      description: 'The name of the board to find.',
    }),
    ad_account_id: adAccountIdDropdown,
    bookmark: Property.ShortText({
      displayName: 'Board Name',
      required: true,
      description: 'The name of the board to find.',
    }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      required: true,
      options: {
        options: [
          { label: 'All', value: 'ALL' },
          { label: 'Protected', value: 'PROTECTED' },
          { label: 'Public', value: 'PUBLIC' },
          { label: 'Secret', value: 'SECRET' },
          { label: 'Public and Secret', value: 'PUBLIC_AND_SECRET' },
        ],
      },
      description: 'Select Privacy.',
    }),
  },
  async run({ auth, propsValue }) {
    const name_search = propsValue.name_search;


    const path = '/boards';
    const response = await makeRequest(
      auth.access_token as string,
      HttpMethod.GET,
      `${path}`
    );

    // Filter Boards based on the query
    const filteredBoards = response.items.filter((board: any) => {
      const searchText = name_search.toLowerCase();
      const name = (board.name || '').toLowerCase();
      return (
        name.includes(searchText)
      );
    });

    return {
      items: filteredBoards,
      bookmark: response.bookmark,
    };
  },
});
