import { createAction, Property } from '@activepieces/pieces-framework';
import { DriveItem } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getLocationDrivePath, requireValue } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelCreateWorkbook = createAction({
  auth: excelAuth,
  name: 'excel_create_workbook',
  classification: 'WRITE',
  displayName: 'Create Workbook',
  description: 'Create a new, empty .xlsx workbook.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new, empty .xlsx workbook in the drive root or a given folder; the .xlsx extension is added when missing. Use excel_upload_workbook instead to store an existing file from a URL. Each call creates a file unless the name exists: Conflict Behavior fail errors, rename adds a copy, replace overwrites — so retries are not safe with rename.',
    idempotent: false,
  },
  props: {
    ...excelAiProps.locationProps,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'File name of the new workbook, e.g. "Budget 2026". ".xlsx" is appended if missing.',
      required: true,
    }),
    parentFolderId: Property.ShortText({
      displayName: 'Parent Folder ID',
      description: 'Drive item ID of the folder to create the workbook in. Leave empty for the drive root.',
      required: false,
    }),
    conflictBehavior: Property.StaticDropdown({
      displayName: 'Conflict Behavior',
      description: 'What to do when a file with the same name already exists in the folder.',
      required: false,
      defaultValue: 'fail',
      options: {
        disabled: false,
        options: [
          { label: 'Fail', value: 'fail' },
          { label: 'Rename', value: 'rename' },
          { label: 'Replace', value: 'replace' },
        ],
      },
    }),
  },
  async run(context) {
    const { name, parentFolderId, conflictBehavior } = context.propsValue;
    const trimmed = requireValue({ value: name, name: 'Name' });
    const fileName = trimmed.toLowerCase().endsWith('.xlsx') ? trimmed : `${trimmed}.xlsx`;
    const drive = getLocationDrivePath(context.propsValue);
    const parent = parentFolderId?.trim();
    const path = parent ? `${drive}/items/${encodeURIComponent(parent)}/children` : `${drive}/root/children`;
    const item: DriveItem = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(path)
      .post({
        name: fileName,
        file: {},
        '@microsoft.graph.conflictBehavior': conflictBehavior ?? 'fail',
      });
    return {
      id: item.id ?? null,
      name: item.name ?? null,
      webUrl: item.webUrl ?? null,
      size: item.size ?? null,
      createdDateTime: item.createdDateTime ?? null,
      parentId: item.parentReference?.id ?? null,
      driveId: item.parentReference?.driveId ?? null,
    };
  },
});
