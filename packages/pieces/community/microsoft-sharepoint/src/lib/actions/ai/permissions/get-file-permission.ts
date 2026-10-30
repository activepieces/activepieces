import { createAction, Property } from '@activepieces/pieces-framework';
import type { Permission } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointGetFilePermissionOutputSchema } from '../../../output-schemas';

export const getFilePermissionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_get_file_permission',
  outputSchema: microsoftSharepointGetFilePermissionOutputSchema,
  displayName: 'Get File Permission',
  description: 'Gets one sharing permission on a file or folder.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one sharing permission on a file or folder, with its roles, grantees, sharing link and where it is inherited from. List File Permissions returns the permission IDs.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    permissionId: Property.ShortText({
      displayName: 'Permission ID',
      description: 'ID of the permission. Use List File Permissions to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const permission: Permission = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/permissions/${encodeURIComponent(propsValue.permissionId)}`
      )
      .get();
    return permission;
  },
});
