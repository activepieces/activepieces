import { createAction, Property } from '@activepieces/pieces-framework';
import type { DriveItem } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointReplaceFileContentOutputSchema } from '../../../output-schemas';

export const replaceFileContentAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_replace_file_content',
  outputSchema: microsoftSharepointReplaceFileContentOutputSchema,
  displayName: 'Replace File Content',
  description: 'Overwrites the content of an existing file in a document library.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Overwrites the content of an existing file, keeping its ID, name and sharing links; files over 4 MB are sent through an upload session. Use Upload File to add a new file by folder and name. List Folder Children, Find File and Search return item IDs.',
    idempotent: false,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({
      required: true,
      displayName: 'File ID',
      description:
        'ID of the existing file to overwrite. Use List Folder Children, Find File or Search to find it.',
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The new content, as a file URL or base64.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = microsoftSharePointClient.create({ auth });
    const itemPath = `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}`;
    const data = propsValue.file.data;
    if (data.length <= SIMPLE_UPLOAD_LIMIT) {
      const item: DriveItem = await client
        .api(`${itemPath}/content`)
        .header('Content-Type', 'text/plain')
        .put(data);
      return item;
    }
    return await microsoftSharePointClient.uploadLargeFile({
      auth,
      sessionPath: `${itemPath}/createUploadSession`,
      data,
      fileName: propsValue.file.filename,
      conflictBehavior: 'replace',
    });
  },
});

const SIMPLE_UPLOAD_LIMIT = 4 * 1024 * 1024;
