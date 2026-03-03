import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath } from '../common/helpers';

export const getWorkbooksAction = createAction({
  auth: excelAuth,
  name: 'get_workbooks',
  description: 'Retrieve a list of workbooks',
  displayName: 'Get Workbooks',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    limit: Property.Number({
      displayName: 'Limit',
      description:
        'Limits the number of workbooks returned, returns all workbooks if empty',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId } = propsValue;
    const limit = propsValue['limit'];

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }

    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const queryParams: any = {}

    if (limit !== null && limit !== undefined) {
      queryParams.$top = limit.toString();
    }

    const request = {
      method: HttpMethod.GET,
      url: `${drivePath}/root/search(q='.xlsx')`,
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
