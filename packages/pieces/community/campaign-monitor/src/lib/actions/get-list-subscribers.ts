import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  clampPage,
  clampPageSize,
  makeRequest,
  transformCustomFields,
} from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId, listId } from '../common/props';
import { listSubscribersOutputSchema } from '../output-schemas';

export const getListSubscribersAction = createAction({
  auth: campaignMonitorAuth,
  name: 'get_list_subscribers',
  classification: 'SEARCH',
  displayName: 'Get List Subscribers',
  description: 'Returns one page of subscribers in a list, filtered by state.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns one page of subscribers from a Campaign Monitor list, filtered by state (active, unsubscribed, bounced, deleted or unconfirmed), with custom fields flattened into a key/value object. The output includes PageNumber, NumberOfPages and TotalNumberOfRecords; request the next Page to read further. Page size is clamped to 10-1000. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listSubscribersOutputSchema,
  props: {
    clientId: clientId,
    listId: listId,
    state: Property.StaticDropdown({
      displayName: 'State',
      required: true,
      defaultValue: 'active',
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
          { label: 'Bounced', value: 'bounced' },
          { label: 'Deleted', value: 'deleted' },
          { label: 'Unconfirmed', value: 'unconfirmed' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number to return, starting at 1.',
      required: false,
      defaultValue: 1,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Subscribers per page, between 10 and 1000.',
      required: false,
      defaultValue: 100,
    }),
    orderField: Property.StaticDropdown({
      displayName: 'Order By',
      required: false,
      defaultValue: 'date',
      options: {
        options: [
          { label: 'Date', value: 'date' },
          { label: 'Email', value: 'email' },
          { label: 'Name', value: 'name' },
        ],
      },
    }),
    orderDirection: Property.StaticDropdown({
      displayName: 'Order Direction',
      required: false,
      defaultValue: 'asc',
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
  },
  async run({ propsValue, auth }) {
    const query = new URLSearchParams({
      page: String(clampPage(propsValue.page)),
      pagesize: String(clampPageSize(propsValue.pageSize)),
      orderfield: propsValue.orderField ?? 'date',
      orderdirection: propsValue.orderDirection ?? 'asc',
      includetrackingpreference: 'true',
      includesmspreference: 'true',
    });
    const response = await makeRequest<{
      Results: Array<
        Record<string, unknown> & {
          CustomFields?: Array<{ Key: string; Value: string }>;
        }
      >;
      PageNumber: number;
      PageSize: number;
      RecordsOnThisPage: number;
      TotalNumberOfRecords: number;
      NumberOfPages: number;
    }>({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.GET,
      path: `/lists/${propsValue.listId}/${
        propsValue.state
      }.json?${query.toString()}`,
    });
    const body = response.body;
    return {
      Results: (body.Results ?? []).map((subscriber) => ({
        ...subscriber,
        CustomFields: transformCustomFields(subscriber.CustomFields),
      })),
      PageNumber: body.PageNumber,
      PageSize: body.PageSize,
      RecordsOnThisPage: body.RecordsOnThisPage,
      TotalNumberOfRecords: body.TotalNumberOfRecords,
      NumberOfPages: body.NumberOfPages,
    };
  },
});
