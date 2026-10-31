import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const getWorksheetsAction = createAction({
  auth: excelAuth,
  name: 'get_worksheets',
  classification: 'SEARCH',
  description: 'Retrieve worksheets from a workbook',
  audience: 'both',
  aiMetadata: { description: 'List the worksheets (tabs) in a workbook, returning metadata such as id, name, and position for each sheet. Use to discover available sheets before reading or writing; to look up a sheet by name use Find Worksheet. Read-only and idempotent; returns up to the given limit unless Return All is enabled.', idempotent: true },
  displayName: 'Get Worksheets',
  propertyGroups: [
    {
      key: 'workbook',
      display: 'section',
      label: 'Workbook',
      icon: 'file',
      props: ['storageSource', 'siteId', 'documentId', 'workbookId'],
    },
    {
      key: 'results',
      display: 'section',
      label: 'Results',
      icon: 'filter',
      props: ['returnAll', 'limit'],
    },
  ],
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    returnAll: Property.Checkbox({
      displayName: 'Return All',
      description: 'Off returns up to the limit below.',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Used when Return All is off. Empty returns all.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run({ propsValue, auth }) {
    const { storageSource, siteId, documentId, workbookId } = propsValue;
    const returnAll = propsValue['returnAll'];
    const limit = propsValue['limit'];
    const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    const endpoint = `${drivePath}/items/${workbookId}/workbook/worksheets`;

    const client = createMSGraphClient(auth['access_token'], cloud);
    const response = await client.api(endpoint).get();

    const worksheets = response.value;

    if (returnAll || limit === null || limit === undefined) {
      return worksheets;
    }
    return worksheets.slice(0, Math.max(0, limit));
  },
});
