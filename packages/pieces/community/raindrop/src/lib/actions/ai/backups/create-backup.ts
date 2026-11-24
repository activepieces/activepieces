import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropCreateBackupOutputSchema } from '../../../output-schemas';

export const raindropCreateBackupAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_create_backup',
  outputSchema: raindropCreateBackupOutputSchema,
  displayName: 'Create Backup',
  description: 'Starts generating a new backup of all bookmarks.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts generating a new full backup in the background; Raindrop.io emails the account owner when it is ready. Returns no backup ID: poll List Backups until a new entry appears, then fetch it with Download Backup. Not idempotent: each call queues another backup and another email.',
    idempotent: false,
  },
  props: {},
  async run({ auth }) {
    return await raindropClient.request<RaindropCreateBackupResponse>({
      auth,
      method: HttpMethod.GET,
      path: '/backup',
    });
  },
});

type RaindropCreateBackupResponse = {
  result: boolean;
  message: string;
};
