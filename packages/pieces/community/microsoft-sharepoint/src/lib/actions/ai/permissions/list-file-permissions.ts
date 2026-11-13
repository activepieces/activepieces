import { createAction } from '@activepieces/pieces-framework';
import type { Permission } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointListFilePermissionsOutputSchema } from '../../../output-schemas';

export const listFilePermissionsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_list_file_permissions',
  outputSchema: microsoftSharepointListFilePermissionsOutputSchema,
  displayName: 'List File Permissions',
  description: 'Lists who has access to a file or folder in a document library.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the sharing permissions on a file or folder, both direct and inherited, with their IDs, roles, grantees and sharing links, one page at a time. Use the permission IDs with Get, Update or Delete File Permission.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    limit: microsoftSharePointAiProps.limit({ required: false }),
    nextLink: microsoftSharePointAiProps.nextLink({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await microsoftSharePointClient.list<Permission>({
      auth,
      path: `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/permissions`,
      limit: propsValue.limit,
      nextLink: propsValue.nextLink,
    });
  },
});
