import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const clearRangeAction = createAction({
  auth: excelAuth,
  name: 'clear_range',
  displayName: 'Clear Cells by Range',
  description: 'Clear a block of cells (range) content or formatting.',
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    range: Property.ShortText({
      displayName: 'Range',
      description:
        'The range of cells to clear, in A1 notation (e.g., "A1:C5").',
      required: true
    }),
    applyTo: Property.StaticDropdown({
      displayName: 'Clear Type',
      description: 'Specify what to clear from the range.',
      required: true,
      defaultValue: 'All',
      options: {
        options: [
          {
            label: 'All (Contents and Formatting)',
            value: 'All'
          },
          {
            label: 'Contents Only',
            value: 'Contents'
          },
          {
            label: 'Formats Only',
            value: 'Formats'
          }
        ]
      }
    })
  },
  async run(context) {
    const { storageSource, siteId, documentId, workbookId, worksheetId, range, applyTo } = context.propsValue;
    const { access_token } = context.auth;
    const cloud = (context.auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

    if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
      throw new Error('please select SharePoint site and document library.');
    }
    const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

    if (!/^[A-Z]+[1-9][0-9]*(:[A-Z]+[1-9][0-9]*)?$/.test(range as string)) {
        throw new Error('Invalid range format. Please use A1 notation (e.g., "A1" or "A1:C5").');
    }

    const client = createMSGraphClient(access_token, cloud);
    await client
      .api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${range}')/clear`)
      .post({ applyTo: applyTo });

    // A successful request returns a 200 OK with no body.
    return {};
  }
});
