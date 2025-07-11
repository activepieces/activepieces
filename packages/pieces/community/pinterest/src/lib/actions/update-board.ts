import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pinterestAuth } from '../common/auth';
import { boardId } from '../common/props';

export const updateBoardAction = createAction({
  name: 'update_board',
  displayName: 'Update Board',
  description: 'Update a board owned by the authenticated user.',
  auth: pinterestAuth,
  props: {
    boardId: boardId({
      displayName: 'Board',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Board Name',
      description: 'The new name of the board.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Board Description',
      description: 'The new description of the board.',
      required: false,
    }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      required: false,
      options: {
        options: [
          { label: 'Public', value: 'PUBLIC' },
          { label: 'Secret', value: 'SECRET' },
        ],
      },
    }),
    ad_account_id: Property.ShortText({
      displayName: 'Ad Account ID (optional)',
      description: 'If provided, modifies the board under the given ad account.',
      required: false,
    }),
  },
  async run(context) {
    const {
      boardId,
      name,
      description,
      privacy,
      ad_account_id,
    } = context.propsValue;

    const query = ad_account_id ? `?ad_account_id=${ad_account_id}` : '';
    const url = `https://api.pinterest.com/v5/boards/${boardId}${query}`;

    const body: Record<string, unknown> = {};

    if (name) body['name'] = name;
    if (description) body['description'] = description;
    if (privacy) body['privacy'] = privacy;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.PATCH,
        url,
        headers: {
          Authorization: `Bearer ${context.auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body,
      });

      return response.body;
    } catch (error: any) {
      const status = error.response?.status;
      const msg = error.response?.data || error.message;

      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${JSON.stringify(msg)}`);
        case 401:
          throw new Error('Unauthorized: Invalid or expired access token.');
        case 403:
          throw new Error('Forbidden: Access denied. Check permissions.');
        case 404:
          throw new Error('Board not found.');
        case 429:
          throw new Error('Rate Limit Exceeded. Try again later.');
        default:
          throw new Error(`Error (${status}): ${JSON.stringify(msg)}`);
      }
    }
  },
});
