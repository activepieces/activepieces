import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { DriveItem } from '@microsoft/microsoft-graph-types';
import { excelAuth } from '../auth';
import { createMSGraphClientFromAuth, getLocationDrivePath, requireValue } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelUploadWorkbook = createAction({
  auth: excelAuth,
  name: 'excel_upload_workbook',
  classification: 'WRITE',
  displayName: 'Upload Workbook',
  description: 'Upload an .xlsx file from a URL into the drive.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Download an .xlsx file from a public URL and store it in the drive root or a given folder (up to 250 MB). Use excel_create_workbook instead for a new empty workbook. Each call writes a file: Conflict Behavior fail errors on an existing name, rename adds a copy, replace overwrites — so retries are not safe with rename.',
    idempotent: false,
  },
  props: {
    ...excelAiProps.locationProps,
    fileUrl: Property.ShortText({
      displayName: 'File URL',
      description: 'Publicly reachable URL of the .xlsx file to upload.',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name to store the file as, e.g. "Report.xlsx". ".xlsx" is appended if missing.',
      required: true,
    }),
    parentFolderId: Property.ShortText({
      displayName: 'Parent Folder ID',
      description: 'Drive item ID of the folder to upload into. Leave empty for the drive root.',
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
    const { fileUrl, fileName, parentFolderId, conflictBehavior } = context.propsValue;
    const url = requireValue({ value: fileUrl, name: 'File URL' });
    const trimmed = requireValue({ value: fileName, name: 'File Name' });
    const name = trimmed.toLowerCase().endsWith('.xlsx') ? trimmed : `${trimmed}.xlsx`;
    const download = await httpClient.sendRequest<Buffer>({
      method: HttpMethod.GET,
      url,
      responseType: 'arraybuffer',
    });
    const drive = getLocationDrivePath(context.propsValue);
    const parent = parentFolderId?.trim();
    const parentSegment = parent ? encodeURIComponent(parent) : 'root';
    const item: DriveItem = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${drive}/items/${parentSegment}:/${encodeURIComponent(name)}:/content`)
      .query({ '@microsoft.graph.conflictBehavior': conflictBehavior ?? 'fail' })
      .header('Content-Type', 'application/octet-stream')
      .put(download.body);
    return {
      id: item.id ?? null,
      name: item.name ?? null,
      webUrl: item.webUrl ?? null,
      size: item.size ?? null,
      lastModifiedDateTime: item.lastModifiedDateTime ?? null,
      parentId: item.parentReference?.id ?? null,
      driveId: item.parentReference?.driveId ?? null,
    };
  },
});
