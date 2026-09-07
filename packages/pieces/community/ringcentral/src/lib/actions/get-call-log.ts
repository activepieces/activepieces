import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { ringcentralAuth } from '../common/auth';
import { ringcentralCommon } from '../common/client';

export const getCallLog = createAction({
  auth: ringcentralAuth,
  name: 'get_call_log',
  displayName: 'Get Call Log',
  description: "Retrieve call log records for the authenticated user's extension.",
  props: {
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: 'Filter records by call direction.',
      required: false,
      options: {
        options: [
          { label: 'Inbound', value: 'Inbound' },
          { label: 'Outbound', value: 'Outbound' },
        ],
      },
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Filter records by call type.',
      required: false,
      options: {
        options: [
          { label: 'Voice', value: 'Voice' },
          { label: 'Fax', value: 'Fax' },
        ],
      },
    }),
    dateFrom: Property.ShortText({
      displayName: 'Date From',
      description: 'The start of the time range in ISO 8601 format (e.g. 2024-01-01T00:00:00Z).',
      required: false,
    }),
    dateTo: Property.ShortText({
      displayName: 'Date To',
      description: 'The end of the time range in ISO 8601 format (e.g. 2024-01-31T23:59:59Z).',
      required: false,
    }),
    perPage: Property.Number({
      displayName: 'Records Per Page',
      description: 'Maximum number of records to return (1-1000).',
      required: false,
    }),
  },
  async run(context) {
    const { direction, type, dateFrom, dateTo, perPage } = context.propsValue;

    const queryParams: QueryParams = {};
    if (direction) queryParams['direction'] = direction;
    if (type) queryParams['type'] = type;
    if (dateFrom) queryParams['dateFrom'] = dateFrom;
    if (dateTo) queryParams['dateTo'] = dateTo;
    if (perPage) queryParams['perPage'] = String(perPage);

    return await ringcentralCommon.sendRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      resourcePath: '/restapi/v1.0/account/~/extension/~/call-log',
      queryParams,
    });
  },
});
