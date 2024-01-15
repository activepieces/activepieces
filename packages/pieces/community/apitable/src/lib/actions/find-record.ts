import {
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { APITableCommon } from '../common';
import { APITableAuth } from '../../index';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const apiTableFindRecord = createAction({
  auth: APITableAuth,
  name: 'apitable_find_record',
  displayName: 'Find APITable Record',
  description: 'Finds records in datasheet.',
  props: {
    datasheet: APITableCommon.datasheet,
    recordIds: Property.Array({
      displayName: 'Record IDs',
      description: 'The IDs of the records to find.',
      required: false,
    }),
    fieldNames: Property.Array({
      displayName: 'Field Names',
      description:
        'The returned record results are limited to the specified fields',
      required: false,
    }),
    maxRecords: Property.Number({
      displayName: 'Max Records',
      description: 'How many records are returned in total',
      required: false,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'How many records are returned per page (max 1000)',
      required: false,
    }),
    pageNum: Property.Number({
      displayName: 'Page Number',
      description: 'Specifies the page number of the page',
      required: false,
    }),
    filter: Property.LongText({
      displayName: 'Filter',
      description:
        'The filter to apply to the records (see https://help.aitable.ai/docs/guide/manual-formula-field-overview/)',
      required: false,
    }),
  },
  async run(context) {
    const auth = context.auth;
    const datasheet = context.propsValue.datasheet;
    const recordIds = context.propsValue.recordIds;
    const fieldNames = context.propsValue.fieldNames;
    const maxRecords = context.propsValue.maxRecords;
    const pageSize = context.propsValue.pageSize ?? 100;
    const pageNum = context.propsValue.pageNum ?? 1;
    const filter = context.propsValue.filter;
    const apiTableUrl = auth.apiTableUrl;

    let query = `?pageSize=${pageSize}&pageNum=${pageNum}`;
    if (recordIds) query += `&recordIds=${recordIds.join(',')}`;
    if (fieldNames) query += `&fieldNames=${fieldNames.join(',')}`;
    if (maxRecords) query += `&maxRecords=${maxRecords}`;
    if (filter) query += `&filterByFormula=${filter}`;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${apiTableUrl.replace(
        /\/$/,
        ''
      )}/fusion/v1/datasheets/${datasheet}/records${query}`,
      headers: {
        Authorization: 'Bearer ' + auth.token,
        'Content-Type': 'application/json',
      },
    };

    const res = await httpClient.sendRequest<any>(request);

    return res.body;
  },
});
