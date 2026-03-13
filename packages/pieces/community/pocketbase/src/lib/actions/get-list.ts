import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pocketbaseAuth } from '../../index';
import { pocketbaseAuthenticate, normalizeHost } from '../common/client';

export const getList = createAction({
  name: 'getList',
  displayName: 'Get List',
  description: 'Gets a paginated list of records from a collection',
  auth: pocketbaseAuth,
  props: {
    collection: Property.ShortText({
      displayName: 'Collection Name',
      description: 'The name of the PocketBase collection',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'The page (offset) of the paginated list (default: 1)',
      required: false,
    }),
    perPage: Property.Number({
      displayName: 'Per Page',
      description: 'Max returned records per page (default: 30)',
      required: false,
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
    skipTotal: Property.Checkbox({
      displayName: 'Skip Total',
      description: 'Skip total counts query for faster results (totalItems and totalPages will be -1)',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { host: rawHost, email, password } = context.auth.props;
    const host = normalizeHost(rawHost);
    const { collection, page, perPage, sort, filter, expand, fields, skipTotal } = context.propsValue;

    const token = await pocketbaseAuthenticate(host, email, password);

    const queryParams: Record<string, string> = {};
    if (page) queryParams['page'] = String(page);
    if (perPage) queryParams['perPage'] = String(perPage);
    if (sort) queryParams['sort'] = sort;
    if (filter) queryParams['filter'] = filter;
    if (expand) queryParams['expand'] = expand;
    if (fields) queryParams['fields'] = fields;
    if (skipTotal) queryParams['skipTotal'] = 'true';

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${host}/api/collections/${encodeURIComponent(collection)}/records`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      queryParams,
    });

    return response.body;
  },
});
