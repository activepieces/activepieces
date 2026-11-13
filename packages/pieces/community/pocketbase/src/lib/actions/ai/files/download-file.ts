import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseAiProps } from '../../../common/ai-props';
import { pocketbaseApi } from '../../../common/api';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseDownloadFileOutputSchema } from '../../../output-schemas';

export const downloadFileAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_download_file',
  outputSchema: pocketbaseDownloadFileOutputSchema,
  displayName: 'Download File',
  description: 'Downloads a file stored in a record\'s file field.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Downloads one file from a record\'s file field and returns it as a file reference. The file name is the value stored in the record\'s file field (Get Record or Get List return it); protected files are supported. Optionally request an image thumbnail size the field allows.',
    idempotent: true,
  },
  props: {
    collection: pocketbaseAiProps.collection({ required: true }),
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'ID of the record that holds the file. Get List returns record IDs.',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'The stored file name exactly as it appears in the record\'s file field, e.g. "report_52iwbgds7l.pdf".',
      required: true,
    }),
    thumb: Property.ShortText({
      displayName: 'Thumbnail Size',
      description: 'Image thumbnail size such as "100x100" or "0x300"; it must be listed in the file field\'s thumb sizes. Leave empty for the original file.',
      required: false,
    }),
  },
  async run(context) {
    const { collection, recordId, fileName, thumb } = context.propsValue;
    const token = await pocketbaseApi.getFileToken({ auth: context.auth });
    const content = await pocketbaseClient.request<ArrayBuffer>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/api/files/${encodeURIComponent(collection)}/${encodeURIComponent(recordId)}/${encodeURIComponent(fileName)}`,
      query: { token, ...(thumb ? { thumb } : {}) },
      responseType: 'arraybuffer',
    });
    const file = await context.files.write({ fileName, data: Buffer.from(content) });
    return { file, fileName };
  },
});
