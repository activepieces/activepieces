import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pandadocAuth } from '../../index';

export const findDocument = createAction({
  auth: pandadocAuth,
  name: 'findDocument',
  displayName: 'Find Document',
  description: 'Search and list documents with various filters',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search query to filter documents by name or content',
      required: false,
    }),
    status: Property.Dropdown({
      displayName: 'Status',
      description: 'Filter documents by status',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Draft', value: 'draft' },
            { label: 'Sent', value: 'sent' },
            { label: 'Completed', value: 'completed' },
            { label: 'Document.Viewed', value: 'document.viewed' },
            { label: 'Document.Completed', value: 'document.completed' },
            { label: 'Document.Expired', value: 'document.expired' },
          ],
        };
      },
    }),
    dateFrom: Property.DateTime({
      displayName: 'Date From',
      description: 'Filter documents created from this date',
      required: false,
    }),
    dateTo: Property.DateTime({
      displayName: 'Date To',
      description: 'Filter documents created until this date',
      required: false,
    }),

    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of documents to skip (for pagination)',
      required: false,
      defaultValue: 0,
    }),
    orderBy: Property.Dropdown({
      displayName: 'Order By',
      description: 'Field to order results by',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Created Date (Descending)', value: '-date_created' },
            { label: 'Created Date (Ascending)', value: 'date_created' },
            { label: 'Modified Date (Descending)', value: '-date_modified' },
            { label: 'Modified Date (Ascending)', value: 'date_modified' },
            { label: 'Name (A-Z)', value: 'name' },
            { label: 'Name (Z-A)', value: '-name' },
          ],
        };
      },
    }),
  },
  async run(context) {
    const { query, status, dateFrom, dateTo, offset, orderBy } =
      context.propsValue;

    const queryParams: Record<string, string> = {};

    if (query) queryParams['q'] = query;
    if (status) queryParams['status'] = status;
    if (dateFrom) queryParams['date_from'] = dateFrom;
    if (dateTo) queryParams['date_to'] = dateTo;

    if (offset) queryParams['offset'] = offset.toString();
    if (orderBy) queryParams['order_by'] = orderBy;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pandadoc.com/public/v1/documents',
      headers: {
        Authorization: `API-Key ${context.auth.apiKey}`,
        'Content-Type': 'application/json',
      },
      queryParams,
    });

    return response.body;
  },
});
