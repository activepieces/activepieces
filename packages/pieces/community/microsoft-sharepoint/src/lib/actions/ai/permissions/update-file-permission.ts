import { createAction, Property } from '@activepieces/pieces-framework';
import type { Permission } from '@microsoft/microsoft-graph-types';

import { microsoftSharePointAuth } from '../../../auth';
import { microsoftSharePointAiProps } from '../../../common/ai-props';
import { microsoftSharePointClient } from '../../../common/client';
import { microsoftSharepointUpdateFilePermissionOutputSchema } from '../../../output-schemas';

const ROLE_OPTIONS = [
  { label: 'Read', value: 'read' },
  { label: 'Write', value: 'write' },
  { label: 'Owner', value: 'owner' },
];

export const updateFilePermissionAction = createAction({
  auth: microsoftSharePointAuth,
  name: 'microsoft_sharepoint_update_file_permission',
  outputSchema: microsoftSharepointUpdateFilePermissionOutputSchema,
  displayName: 'Update File Permission',
  description: 'Changes the role of a sharing permission on a file or folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the role (read, write or owner) of one direct sharing permission on a file or folder. List File Permissions returns the permission IDs; organization and people sharing links cannot be changed this way.',
    idempotent: true,
  },
  props: {
    driveId: microsoftSharePointAiProps.driveId({ required: true }),
    itemId: microsoftSharePointAiProps.itemId({ required: true }),
    permissionId: Property.ShortText({
      displayName: 'Permission ID',
      description: 'ID of the permission to change. Use List File Permissions to find it.',
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'The new role: "read", "write" or "owner".',
      required: true,
      options: { disabled: false, options: ROLE_OPTIONS },
    }),
  },
  async run({ auth, propsValue }) {
    if (!ROLE_OPTIONS.some((option) => option.value === propsValue.role)) {
      throw new Error('Role must be "read", "write" or "owner".');
    }
    const permission: Permission = await microsoftSharePointClient
      .create({ auth })
      .api(
        `/drives/${encodeURIComponent(propsValue.driveId)}/items/${encodeURIComponent(propsValue.itemId)}/permissions/${encodeURIComponent(propsValue.permissionId)}`
      )
      .patch({ roles: [propsValue.role] });
    return permission;
  },
});
