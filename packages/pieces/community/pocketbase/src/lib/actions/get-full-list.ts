import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pocketbaseAuth } from '../../index';
import { pocketbaseAuthenticate, normalizeHost } from '../common/client';

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
    sort: Property.ShortText({
      displayName: 'Sort',
      description: 'Order attribute(s). Use - for DESC, + for ASC. E.g.: -created,id',
      required: false,
    }),
    filter: Property.ShortText({
      displayName: 'Filter',
      description: "Filter expression. E.g.: (id='abc' && created>'2022-01-01')",
      required: false,
    }),
    expand: Property.ShortText({
      displayName: 'Expand',
      description: 'Auto expand relations. E.g.: relField1,relField2.subRelField',
      required: false,
    }),
    fields: Property.ShortText({
      displayName: 'Fields',
      description: 'Comma separated fields to return. E.g.: *,expand.relField.name',
      required: false,
    }),
  },
  async run(context) {
    const { host: rawHost, email, password } = context.auth.props;
    const host = normalizeHost(rawHost);
    const { collection, sort, filter, expand, fields } = context.propsValue;

    const token = await pocketbaseAuthenticate(host, email, password);

    let allItems: unknown[] = [];
    let page = 1;
    const perPage = 200;
    let serverTotalItems = 0;

    while (true) {
      const queryParams: Record<string, string> = {
        page: String(page),
        perPage: String(perPage),
        skipTotal: 'false',
      };
      if (sort) queryParams['sort'] = sort;
      if (filter) queryParams['filter'] = filter;
      if (expand) queryParams['expand'] = expand;
      if (fields) queryParams['fields'] = fields;

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${host}/api/collections/${encodeURIComponent(collection)}/records`,
        headers: { Authorization: `Bearer ${token}` },
        queryParams,
      });

      const body = response.body as { items: unknown[]; totalItems: number };
      if (!body.items || body.items.length === 0) break;
      serverTotalItems = body.totalItems;
      allItems = allItems.concat(body.items);

      if (allItems.length >= body.totalItems) break;
      page++;
    }

    return { items: allItems, totalItems: serverTotalItems };
  },
});
