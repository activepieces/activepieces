import { ApEdition } from '@activepieces/shared';

import { api } from '@/lib/api';

export const oauthAppsApi = {
  listCloudOAuth2Apps(
    edition: ApEdition,
  ): Promise<Record<string, { clientId: string }>> {
    return api.get<Record<string, { clientId: string }>>(
      'https://secrets.activepieces.com/apps',
      {
        edition,
      },
    );
  },
};
