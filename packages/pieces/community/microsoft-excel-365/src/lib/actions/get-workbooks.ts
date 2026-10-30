import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { DriveItem } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const getWorkbooksAction = createAction({
  auth: excelAuth,
  name: 'get_workbooks',
  classification: 'SEARCH',
  description: 'Retrieve a list of workbooks',
  audience: 'both',
  aiMetadata: { description: 'List .xlsx workbooks in a OneDrive or SharePoint drive, returning id, name, and webUrl for each. Use to browse or enumerate available spreadsheets; to find one specific file by exact name use Find Workbook. Read-only and idempotent; an optional limit caps results, otherwise all matches are returned.', idempotent: true },
  displayName: 'Get Workbooks',
  propertyGroups: [
    {
      key: 'drive',
      display: 'section',
      label: 'Drive',
      icon: 'file',
      props: ['storageSource', 'siteId', 'documentId'],
    },
  ],
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Empty returns all workbooks.',
      required: false,
      advanced: true,
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
    const hasLimit = limit !== null && limit !== undefined;

    const client = createMSGraphClient(auth['access_token'], cloud);
    let apiCall = client.api(`${drivePath}/root/search(q='.xlsx')`);

    if (hasLimit) {
      apiCall = apiCall.top(limit);
    }

    const items: DriveItem[] = [];
    let response: PageCollection | undefined = await apiCall.get();
    while (response) {
      items.push(...(response.value ?? []));
      const nextLink = response['@odata.nextLink'];
      const reachedLimit = hasLimit && items.length >= limit;
      response = !reachedLimit && nextLink ? await client.api(nextLink).get() : undefined;
    }

    const workbooks = (hasLimit ? items.slice(0, Math.max(0, limit)) : items).map((item) => ({
      id: item.id,
      name: item.name,
      webUrl: item.webUrl,
    }));

    return workbooks;
  },
});
