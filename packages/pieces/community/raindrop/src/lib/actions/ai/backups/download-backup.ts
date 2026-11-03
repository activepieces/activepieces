import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropDownloadBackupOutputSchema } from '../../../output-schemas';

export const raindropDownloadBackupAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_download_backup',
  outputSchema: raindropDownloadBackupOutputSchema,
  displayName: 'Download Backup',
  description: 'Downloads a backup as an HTML or CSV file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads one backup as an HTML (browser bookmarks format) or CSV file and returns the stored file. Get the Backup ID from List Backups; a backup started with Create Backup only appears there once it is ready.',
    idempotent: true,
  },
  props: {
    backupId: Property.ShortText({
      displayName: 'Backup ID',
      description: 'Backup ID from List Backups, e.g. "659d42a35ffbb2eb5ae1cb86".',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'File format of the download.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'HTML', value: 'html' },
          { label: 'CSV', value: 'csv' },
        ],
      },
    }),
  },
  async run({ auth, propsValue, files }) {
    const response = await raindropClient.request<Buffer>({
      auth,
      method: HttpMethod.GET,
      path: `/backup/${encodeURIComponent(propsValue.backupId)}.${encodeURIComponent(
        propsValue.format,
      )}`,
      responseType: 'arraybuffer',
    });
    const fileName = `raindrop-backup-${propsValue.backupId}.${propsValue.format}`;
    const file = await files.write({ fileName, data: Buffer.from(response) });
    return { file, fileName };
  },
});
