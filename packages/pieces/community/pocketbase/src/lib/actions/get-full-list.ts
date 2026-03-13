import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pocketbaseAuth } from '../../index';
import { pocketbaseAuthenticate } from '../common/client';

export const getFullList = createAction({
  name: 'getFullList',
  displayName: 'Get Full List',
  description: 'Gets all the data for a given collection',
  auth: pocketbaseAuth,
  props: {
    collection: Property.ShortText({
      displayName: 'Collection Name',
      description: 'The name of the PocketBase collection',
      required: true,
    }),
  },
  async run(context) {
    const { host, email, password } = context.auth.props;
    const { collection } = context.propsValue;

    const token = await pocketbaseAuthenticate(host, email, password);

    let allItems: unknown[] = [];
    let page = 1;
    const perPage = 200;

    while (true) {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${host}/api/collections/${encodeURIComponent(collection)}/records`,
        headers: { Authorization: `Bearer ${token}` },
        queryParams: { page: String(page), perPage: String(perPage) },
      });

      const body = response.body as { items: unknown[]; totalItems: number };
      allItems = allItems.concat(body.items);

      if (allItems.length >= body.totalItems) break;
      page++;
    }

    return { items: allItems, totalItems: allItems.length };
  },
});
