import { Property } from '@activepieces/pieces-framework';
import { canvaAuth } from '../../index';
import { canvaApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.canva.com/rest/v1';

/**
 * Design dropdown - dynamically loads user's designs
 */
export const designDropdown = Property.Dropdown({
  displayName: 'Design',
  description: 'Select a design from your Canva account',
  required: true,
  refreshers: [],
  auth: canvaAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Please connect your account first',
        options: [],
      };
    }

    try {
      const response = await canvaApiCall<{
        items: Array<{ id: string; title?: string }>;
      }>({
        auth,
        method: HttpMethod.GET,
        path: '/designs',
        queryParams: {
          limit: '50',
        },
      });

      return {
        disabled: false,
        options: response.items.map((design) => ({
          label: design.title || design.id,
          value: design.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        placeholder: 'Error loading designs',
        options: [],
      };
    }
  },
});
