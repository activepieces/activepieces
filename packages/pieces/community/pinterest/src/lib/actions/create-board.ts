import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pinterestAuth } from '../common/auth';

export const createBoardAction = createAction({
  name: 'create_board',
  displayName: 'Create Board',
  description: 'Create a new board owned by the authenticated user.',
  auth: pinterestAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Board Name',
      description: 'The name of the board.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Board Description',
      required: false,
    }),
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      required: false,
      options: {
        options: [
          { label: 'Public', value: 'PUBLIC' },
          { label: 'Protected', value: 'PROTECTED' },
          { label: 'Secret', value: 'SECRET' },
        ],
      },
      defaultValue: 'PUBLIC',
    }),
    is_ads_only: Property.Checkbox({
      displayName: 'Is Ad-Only Board?',
      description: 'If true, the board is only for ad pins and may be reused.',
      required: false,
      defaultValue: false,
    }),
    ad_account_id: Property.ShortText({
      displayName: 'Ad Account ID (optional)',
      description: 'If provided, creates the board under the specified ad account.',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      description,
      privacy,
      is_ads_only,
      ad_account_id,
    } = context.propsValue;

    const queryString = ad_account_id ? `?ad_account_id=${ad_account_id}` : '';
    const url = `https://api.pinterest.com/v5/boards${queryString}`;

    const body: Record<string, unknown> = {
      name,
    };

    if (description) body['description'] = description;
    if (privacy) body['privacy'] = privacy;
    if (is_ads_only !== undefined) body['is_ads_only'] = is_ads_only;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
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
          throw new Error('Forbidden: Access denied. Check scopes or permissions.');
        case 429:
          throw new Error('Rate Limit Exceeded: Try again later.');
        default:
          throw new Error(`Error (${status}): ${JSON.stringify(msg)}`);
      }
    }
  },
});
