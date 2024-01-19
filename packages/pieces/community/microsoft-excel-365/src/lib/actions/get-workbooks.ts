import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { excelAuth } from '../../index';
import { excelCommon } from '../common/common';

export const getWorkbooksAction = createAction({
  auth: excelAuth,
  name: 'get_workbooks',
  description: 'Retrieve a list of workbooks',
  displayName: 'Get Workbooks',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description:
        'Limits the number of workbooks returned, returns all workbooks if empty',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const limit = propsValue['limit'];

    const queryParams: any = {
      $filter:
        "file ne null and file/mimeType eq 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'",
    };

    if (limit !== null && limit !== undefined) {
      queryParams.$top = limit.toString();
    }

    const request = {
      method: HttpMethod.GET,
      url: `${excelCommon.baseUrl}/root/search(q='.xlsx')`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN as const,
        token: auth['access_token'],
      },
      queryParams: queryParams,
    };

    const response = await httpClient.sendRequest(request);
    const workbooks = response.body['value'].map(
      (item: { id: any; name: any; webUrl: any }) => ({
        id: item.id,
        name: item.name,
        webUrl: item.webUrl,
      })
    );

    return workbooks;
  },
});
