import { createAction, Property } from '@activepieces/pieces-framework';
import type { Permission } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharePointUtils } from '../../../common/utils';
import { microsoftSharepointGetFilePermissionOutputSchema } from '../../../output-schemas';

export const revokeFilePermissionGrantsAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_revoke_file_permission_grants',
  outputSchema: microsoftSharepointGetFilePermissionOutputSchema,
  displayName: 'Revoke File Permission Grants',
  description: 'Removes people from a sharing link on a file or folder.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes some people from a sharing link that is scoped to specific users, keeping the link for everyone else. Only works on such sharing links, not direct grants or anonymous and organization links; use Delete File Permission for those. List File Permissions returns the permission IDs.',
    idempotent: false,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    permissionId: Property.ShortText({
      displayName: 'Permission ID',
      description: 'ID of the sharing link permission. Use List File Permissions to find it.',
      required: true,
    }),
    grantees: Property.Array({
      displayName: 'Grantees',
      description: 'Email addresses of the people whose access to the link is revoked.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const permission: Permission = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/permissions/${encodeURIComponent(propsValue.permissionId)}/revokeGrants`
      )
      .post({ grantees: microsoftSharePointUtils.toRecipients({ emails: propsValue.grantees, propName: 'Grantees' }) });
    return permission;
  },
});
