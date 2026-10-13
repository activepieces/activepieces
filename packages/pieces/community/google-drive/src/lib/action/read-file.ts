import { googleDriveAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { downloadFileFromDrive } from '../common/get-file-content';
import { readFileActionOutputSchema } from '../output-schemas';

export const readFile = createAction({
  auth: googleDriveAuth,
  name: 'read-file',
  classification: 'READ',
  displayName: 'Download File',
  description: 'Download a file. Google Docs, Sheets and Slides become Office files.',
  audience: 'human',
  aiMetadata: { description: 'Downloads the content of a Drive file by its file ID and returns it as a usable file reference. Use to retrieve a file an agent already knows the ID of (e.g. from a trigger or search). Read-only and idempotent. Requires the exact file ID, not a name.', idempotent: true },
  props: {
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'Use the ID from a trigger or the Find File or Folder action.',
      required: true,
      placeholder: '1dpv4-sKJfKRwI9qx1vWqQhEGEn3EpbI5',
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name for the saved file. Empty uses the file ID plus its extension.',
      required: false,
      placeholder: 'report.pdf',
    }),
  },
  outputSchema: readFileActionOutputSchema,
  run: async ({ auth, propsValue, files }) => {
    return downloadFileFromDrive(auth, files, propsValue.fileId, propsValue.fileName)
  },
});
