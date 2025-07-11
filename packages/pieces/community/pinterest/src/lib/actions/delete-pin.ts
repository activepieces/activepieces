import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { pinterestAuth } from '../common/auth';
import { pinId } from '../common/props';

export const deletePinAction = createAction({
  name: 'delete_pin',
  displayName: 'Delete Pin',
  description: 'Delete a pin owned by the authenticated user.',
  auth: pinterestAuth,
  props: {
    pinId: pinId({
      displayName: 'Pin',
      required: true,
    }),
    ad_account_id: Property.ShortText({
      displayName: 'Ad Account ID (optional)',
      description: 'Business Ad Account ID (optional, used for Business Access).',
      required: false,
    }),
  },
  async run(context) {
    const { pinId, ad_account_id } = context.propsValue;

    const query = ad_account_id ? `?ad_account_id=${ad_account_id}` : '';
    const url = `https://api.pinterest.com/v5/pins/${pinId}${query}`;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url,
        headers: {
          Authorization: `Bearer ${context.auth.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        message: `Pin ${pinId} deleted successfully.`,
        status: response.status,
      };
    } catch (error: any) {
      const status = error.response?.status;
      const msg = error.response?.data || error.message;

      switch (status) {
        case 400:
          throw new Error(`Bad Request: ${JSON.stringify(msg)}`);
        case 401:
          throw new Error('Unauthorized: Invalid or expired token.');
        case 403:
          throw new Error('Forbidden: You do not have permission to delete this pin.');
        case 404:
          throw new Error('Pin not found.');
        case 429:
          throw new Error('Rate Limit Exceeded. Try again later.');
        default:
          throw new Error(`Error (${status}): ${JSON.stringify(msg)}`);
      }
    }
  },
});
