import { Property } from '@activepieces/pieces-framework';

function booleanDropdown({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown<boolean>({
    displayName,
    description,
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
  });
}

const storageSource = Property.StaticDropdown({
  displayName: 'Storage',
  description: 'Where the workbook lives. Defaults to the connected user\'s OneDrive.',
  required: false,
  defaultValue: 'onedrive',
  options: {
    disabled: false,
    options: [
      { label: 'OneDrive', value: 'onedrive' },
      { label: 'SharePoint', value: 'sharepoint' },
    ],
  },
});

const siteId = Property.ShortText({
  displayName: 'SharePoint Site ID',
  description: 'Required only when Storage is SharePoint.',
  required: false,
});

const driveId = Property.ShortText({
  displayName: 'SharePoint Drive ID',
  description: 'Document library (drive) ID. Required only when Storage is SharePoint.',
  required: false,
});

const workbookId = Property.ShortText({
  displayName: 'Workbook ID',
  description: 'Drive item ID of the .xlsx file. Resolve from a name with excel_search_workbooks or excel_list_workbooks.',
  required: true,
});

const worksheet = Property.ShortText({
  displayName: 'Worksheet',
  description: 'Worksheet name (e.g. "Sheet1") or ID. Resolve via excel_list_worksheets.',
  required: true,
});

const table = Property.ShortText({
  displayName: 'Table',
  description: 'Table name (e.g. "Table1") or ID. Resolve via excel_list_tables.',
  required: true,
});

const chart = Property.ShortText({
  displayName: 'Chart',
  description: 'Chart name (e.g. "Chart 1") or ID. Resolve via excel_list_charts.',
  required: true,
});

const address = Property.ShortText({
  displayName: 'Range Address',
  description: 'Cell range in A1 notation on the worksheet, e.g. "A1:C10", "B2", "A:A" or "5:5".',
  required: true,
});

const locationProps = { storageSource, siteId, driveId };

export const excelAiProps = {
  storageSource,
  siteId,
  driveId,
  workbookId,
  worksheet,
  table,
  chart,
  address,
  locationProps,
  booleanDropdown,
};
