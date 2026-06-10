import { Property } from '@activepieces/pieces-framework';

import { cannyAuth } from '../auth';
import { cannyRequest } from './client';

export const boardIdProp = Property.Dropdown({
  auth: cannyAuth,
  displayName: 'Board',
  description: 'The board to use.',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your Canny account first.',
        options: [],
      };
    }

    const response = await cannyRequest<{
      boards: Array<{ id: string; name: string }>;
    }>({
      apiKey: auth.secret_text,
      path: '/boards/list',
    });

    return {
      disabled: false,
      options: (response.boards ?? []).map((b) => ({
        label: b.name,
        value: b.id,
      })),
    };
  },
});
