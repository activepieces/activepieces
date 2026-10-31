import { createAction, MarkdownVariant, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';

export const clearRangeAction = createAction({
  auth: excelAuth,
  name: 'clear_range',
  classification: 'DESTRUCTIVE',
  displayName: 'Clear Cells by Range',
  description: 'Clear the contents or formatting of a range.',
  audience: 'both',
  aiMetadata: { description: 'Clear a block of cells in A1 notation, choosing to remove contents only, formatting only, or both. Pick this to wipe cell values or styles in place without deleting the worksheet or shifting cells. Idempotent: clearing the same range repeatedly yields the same emptied state.', idempotent: true },
  propertyGroups: [
    {
      key: 'workbook',
      display: 'section',
      label: 'Workbook',
      icon: 'file',
      props: ['storageSource', 'siteId', 'documentId', 'workbookId', 'worksheetId']
    },
    {
      key: 'range',
      display: 'section',
      label: 'Range',
      icon: 'markdown',
      props: ['range', 'applyTo', 'clear_warning']
    }
  ],
  props: {
    storageSource: commonProps.storageSource,
    siteId: commonProps.siteId,
    documentId: commonProps.documentId,
    workbookId: commonProps.workbookId,
    worksheetId: commonProps.worksheetId,
    range: Property.ShortText({
      displayName: 'Range',
      description: 'Cells in A1 notation, in capitals.',
      placeholder: 'A1:C10',
      required: true
    }),
    applyTo: Property.StaticDropdown({
      displayName: 'What to Clear',
      required: true,
      defaultValue: 'All',
      display: 'cards',
      options: {
        options: [
          {
            label: 'Everything',
            value: 'All',
            icon: 'trash'
          },
          {
            label: 'Contents',
            value: 'Contents',
            icon: 'text'
          },
          {
            label: 'Formatting',
            value: 'Formats',
            icon: 'sliders'
          }
        ]
      }
    }),
    clear_warning: Property.MarkDown({
      value: 'Cleared cells cannot be restored.',
      variant: MarkdownVariant.WARNING
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

    return {};
  }
});
