import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

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
    const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }

    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const client = createMSGraphClient(auth['access_token'], cloud);
    let apiCall = client.api(`${drivePath}/root/search(q='.xlsx')`);

    if (limit !== null && limit !== undefined) {
      apiCall = apiCall.top(limit);
    }

    const response = await apiCall.get();
    const workbooks = response.value.map(
      (item: { id: any; name: any; webUrl: any }) => ({
        id: item.id,
        name: item.name,
        webUrl: item.webUrl,
      })
    );

    return workbooks;
  },
});
