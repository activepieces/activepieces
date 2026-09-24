import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { GraphDriveItem, oneDriveApi } from '../common/graph-api';
import { onedriveItemOutputSchema } from '../output-schemas';

export const onedriveCreateTextFile = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_create_text_file',
  displayName: 'Create Text File',
  description: 'Create a plain-text file in a OneDrive folder from text you provide.',
  audience: 'ai',
  outputSchema: onedriveItemOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a file in a OneDrive folder whose content is the given text (up to 4 MiB), without needing a file object; use Upload File for binary files and Replace File Content to overwrite a known item. It writes plain UTF-8 text only, so naming it `.docx` or `.xlsx` does not produce a real Word or Excel file. By default it fails if the name already exists; Rename or Replace change that, and each Rename call creates another file.',
    idempotent: false,
  },
  props: {
    folderId: Property.ShortText({
      displayName: 'Folder ID',
      description:
        'The ID of the destination folder, from Search Files and Folders or List Folder Contents. Leave empty for the drive root.',
      required: false,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'The name of the new file, including its extension, e.g. `notes.txt` or `data.csv`.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'The text to write into the file (up to 4 MiB).',
      required: true,
    }),
    conflictBehavior: Property.StaticDropdown({
      displayName: 'If the Name Exists',
      description: 'What to do when the folder already has an item with this name.',
      required: true,
      defaultValue: 'fail',
      options: {
        disabled: false,
        options: [
          { label: 'Fail', value: 'fail' },
          { label: 'Rename the new file', value: 'rename' },
          { label: 'Replace the existing file', value: 'replace' },
        ],
      },
    }),
  },
  async run(context) {
    const { folderId, fileName, content, conflictBehavior } = context.propsValue;
    const name = fileName.trim();
    if (!name) {
      throw new Error('File Name cannot be empty.');
    }
    const byteLength = Buffer.byteLength(content, 'utf8');
    if (byteLength > SIMPLE_UPLOAD_LIMIT) {
      throw new Error('Content is larger than 4 MiB. Use Upload File for large content.');
    }
    const item = await oneDriveApi.request<GraphDriveItem>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `${oneDriveApi.folderPath({ folderId })}:/${encodeURIComponent(name)}:/content`,
      queryParams: { '@microsoft.graph.conflictBehavior': conflictBehavior ?? 'fail' },
      body: content,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
    return oneDriveApi.toItem(item);
  },
});

const SIMPLE_UPLOAD_LIMIT = 4 * 1024 * 1024;
