import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';

import { bubbleAuth } from '../../index';
import { bubbleCommon } from '../common';

export const bubbleListThingsAction = createAction({
  auth: bubbleAuth,
  name: 'bubble_list_things',
  displayName: 'List Thing',
  description: 'List things by type',
  props: {
    typename: bubbleCommon.typename,
    constraint: Property.StaticDropdown({
      displayName: 'Constraint',
      required: true,
      options: {
        options: [
          {
            label: 'equals or not equal',
            value: 'equals or not equal',
          },
          {
            label: 'text contains or not text contains',
            value: 'text contains or not text contains',
          },
          {
            label: 'greater than or less than',
            value: 'greater than or less than',
          },
          {
            label: 'in or not in',
            value: 'in or not in',
          },
          {
            label: 'contains or not contains',
            value: 'contains or not contains',
          },
          {
            label: 'empty or not empty',
            value: 'empty or not empty',
          },
          {
            label: 'geographic_search',
            value: 'geographic_search',
          },
        ],
      },
    }),
    field: Property.ShortText({
      displayName: 'Field',
      required: true,
    }),
    value: Property.ShortText({
      displayName: 'Value',
      required: true,
    }),
    cursor: Property.Number({
      displayName: 'Start from',
      required: true,
    }),

    limit: Property.Number({
      displayName: 'Limit',
      required: true,
    }),
  },
  async run(context) {
    const { appname, token } = context.auth;
    const { typename, constraint, field, value, cursor, limit } =
      context.propsValue;

    const server_url = `https://${appname}.bubbleapps.io/api/1.1/obj/${typename}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: server_url,
      headers: {
        'user-agent': 'activepieces',
        Authorization: `Bearer ${token}`,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token,
      },
      body: {
        constraint: constraint,
        field: field,
        value: value,
        cursor: cursor,
        limit: limit,
      },
    });

    return response.body;
  },
});
