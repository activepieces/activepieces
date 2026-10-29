import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropListBackupsOutputSchema } from '../../../output-schemas';

export const raindropListBackupsAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_list_backups',
  outputSchema: raindropListBackupsOutputSchema,
  displayName: 'List Backups',
  description: 'Lists the account backups, newest first.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists the account's backups with their IDs and creation dates, newest first. Use it to get the Backup ID for Download Backup, or to check whether a backup started with Create Backup is ready.",
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await raindropClient.request<RaindropListBackupsResponse>({
      auth,
      method: HttpMethod.GET,
      path: '/backups',
    });
  },
});

type RaindropListBackupsResponse = {
  result: boolean;
  items: { _id: string; created: string }[];
};
