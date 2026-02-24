import { carboneAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

const CARBONE_API_URL = 'https://api.carbone.io';
const CARBONE_VERSION = '5';

export const listTagsAction = createAction({
  auth: carboneAuth,
  name: 'carbone_list_tags',
  displayName: 'List Tags',
  description:
    'Retrieve all tags used by Carbone templates. Tags help categorize templates for organization.',
  props: {},
  async run(context) {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${CARBONE_API_URL}/templates/tags`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
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
        `Failed to list tags: ${response.body.error ?? 'Unknown error'}`
      );
    }

    return {
      tags: response.body.data.map((t) => t.name),
      count: response.body.data.length,
    };
  },
});
