import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseApi } from '../../../common/api';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseDownloadBackupOutputSchema } from '../../../output-schemas';

export const downloadBackupAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_download_backup',
  outputSchema: pocketbaseDownloadBackupOutputSchema,
  displayName: 'Download Backup',
  description: 'Downloads a stored backup zip.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Downloads one stored backup zip and returns it as a file reference. The key comes from List Backups.',
    idempotent: true,
  },
  props: {
    key: Property.ShortText({
      displayName: 'Backup Key',
      description: 'Backup file name, e.g. "pb_backup_20240101.zip". List Backups returns it.',
      required: true,
    }),
  },
  async run(context) {
    const { key } = context.propsValue;
    const token = await pocketbaseApi.getFileToken({ auth: context.auth });
    const content = await pocketbaseClient.request<ArrayBuffer>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/api/backups/${encodeURIComponent(key)}`,
      query: { token },
      responseType: 'arraybuffer',
    });
    const file = await context.files.write({ fileName: key, data: Buffer.from(content) });
    return { file, key };
  },
});
