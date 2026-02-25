import { carboneAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

const CARBONE_API_URL = 'https://api.carbone.io';
const CARBONE_VERSION = '5';

export const listCategoriesAction = createAction({
  auth: carboneAuth,
  name: 'carbone_list_categories',
  displayName: 'List Categories',
  description:
    'Retrieve all categories used by Carbone templates. Categories function like folders for organizing templates.',
  props: {},
  async run(context) {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${CARBONE_API_URL}/templates/categories`,
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        'carbone-version': CARBONE_VERSION,
      },
    };

    const response = await httpClient.sendRequest<{
      success: boolean;
      data: Array<{ name: string }>;
      error?: string;
    }>(request);

    if (!response.body.success) {
      throw new Error(
        `Failed to list categories: ${response.body.error ?? 'Unknown error'}`
      );
    }

    return {
      categories: response.body.data.map((c) => c.name),
      count: response.body.data.length,
    };
  },
});
