import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointDeleteFilePermissionOutputSchema } from '../../../output-schemas';

export const deleteFilePermissionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_delete_file_permission',
  outputSchema: microsoftSharepointDeleteFilePermissionOutputSchema,
  displayName: 'Delete File Permission',
  description: 'Removes a sharing permission from a file or folder.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently removes one direct sharing permission or sharing link from a file or folder; inherited permissions cannot be removed here. List File Permissions returns the permission IDs; use Revoke File Permission Grants to remove only some people from a sharing link.',
    idempotent: false,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    permissionId: Property.ShortText({
      displayName: 'Permission ID',
      description: 'ID of the permission to remove. Use List File Permissions to find it.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    await microsoftSharePointClient
      .create({ auth })
      .api(
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/permissions/${encodeURIComponent(propsValue.permissionId)}`
      )
      .delete();
    return { deleted: true, permissionId: propsValue.permissionId };
  },
});
