import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pinterestAuth } from '../common/auth';

export const findBoardByNameAction = createAction({
  name: 'find_board_by_name',
  displayName: 'Find Board by Name',
  description: 'Locate a board by its name for pinning or updates.',
  auth: pinterestAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Board Name',
      description: 'The board name to search for (case-insensitive match).',
      required: true,
    }),
    ad_account_id: Property.ShortText({
      displayName: 'Ad Account ID (optional)',
      required: false,
    }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy Filter (optional)',
      required: false,
      options: {
        options: [
          { label: 'All', value: 'ALL' },
          { label: 'Public', value: 'PUBLIC' },
          { label: 'Secret', value: 'SECRET' },
          { label: 'Protected', value: 'PROTECTED' },
          { label: 'Public & Secret', value: 'PUBLIC_AND_SECRET' },
        ],
      },
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { name, ad_account_id, privacy, page_size } = context.propsValue;

    const queryParams = new URLSearchParams();
    if (ad_account_id) queryParams.append('ad_account_id', ad_account_id);
    if (privacy) queryParams.append('privacy', privacy);
    if (page_size) queryParams.append('page_size', page_size.toString());

    const url = `https://api.pinterest.com/v5/boards?${queryParams.toString()}`;

    const response = await httpClient.sendRequest<{ items: any[] }>({
      method: HttpMethod.GET,
      url,
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    const boards = response.body.items || [];

    const matches = boards.filter(board =>
      board.name.toLowerCase() === name.toLowerCase()
    );

    return {
      total: matches.length,
      matches,
    };
  },
});
