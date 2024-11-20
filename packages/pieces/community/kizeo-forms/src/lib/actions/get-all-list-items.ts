import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { endpoint, kizeoFormsCommon } from '../common';
import { kizeoFormsAuth } from '../..';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const getAllListItems = createAction({
  auth: kizeoFormsAuth,

  name: 'get_all_list_items',
  displayName: 'Get All List Items',
  description: 'Get all items from a specific list',
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Pattern to search',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Max number of results to return',
      required: false,
    }),
    sort: Property.ShortText({
      displayName: 'Sort',
      description: 'Target for sorting',
      required: false,
    }),
    direction: Property.ShortText({
      displayName: 'Direction',
      description: 'Sorting: asc or desc',
      required: false,
    }),
    listId: kizeoFormsCommon.listId,
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      limit: z.number().min(1).optional(),
    });
    const { listId, search, offset, limit, sort, direction } =
      context.propsValue;

    let parameters = '';
    if (search) parameters += `search=${search}&`;
    if (offset) parameters += `offset=${offset}&`;
    if (limit) parameters += `limit=${limit}&`;
    if (sort) parameters += `sort=${sort}&`;
    if (direction) parameters += `direction=${direction}&`;

    const response = await httpClient.sendRequest<{ data: unknown }>({
      method: HttpMethod.GET,
      url:
        endpoint +
        `public/v4/lists/${listId}/items?${parameters}used-with-activepieces=`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: context.auth,
      },
    });
    if (response.status === 200) {
      return response.body;
    }
    return [];
  },
});
