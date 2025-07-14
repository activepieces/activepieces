import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';

export const listModels = createAction({
  auth: mistralAuth,
  name: 'list_models',
  displayName: 'List Models',
  description: 'Retrieve a list of available Mistral models to use for completions or embeds.',
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search string to filter models.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number (starts at 0).',
      required: false,
      defaultValue: 0,
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      description: 'Number of models per page.',
      required: false,
      defaultValue: 20,
    }),
    fetchAll: Property.Checkbox({
      displayName: 'Fetch All',
      description: 'Fetch all models across all pages.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { search, page, page_size, fetchAll } = propsValue;
    const params: Record<string, any> = {};
    if (search) params['search'] = search;
    if (page !== undefined) params['page'] = String(page);
    if (page_size !== undefined) params['page_size'] = String(page_size);
    if (fetchAll) {
      let all: any[] = [];
      let currentPage = 0;
      while (true) {
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: 'https://api.mistral.ai/v1/models',
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
          queryParams: { ...params, page: String(currentPage) },
        });
        const data = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
        if (!data.data || data.data.length === 0) break;
        all = all.concat(data.data);
        if (data.data.length < (page_size ?? 20)) break;
        currentPage++;
      }
      return all;
    } else {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.mistral.ai/v1/models',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
        queryParams: params,
      });
      return typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
    }
  },
});

export type MistralModel = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  permission: any[];
};

export type MistralListModelsResponse = {
  object: string;
  data: MistralModel[];
}; 