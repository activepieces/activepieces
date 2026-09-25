import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveApi } from '../common/graph-api';
import { onedrivePermissionOutputSchema } from '../output-schemas';

export const onedriveUpdateItemPermission = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_update_item_permission',
  displayName: 'Update Permission Role',
  description: 'Change a permission on a OneDrive file or folder to read or write.',
  audience: 'ai',
  outputSchema: onedrivePermissionOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the role of one existing permission on a file or folder to read or write, replacing its current roles. Get the permission ID from List File Permissions; inherited permissions cannot be changed here and must be changed on the parent folder they come from. Safe to retry with the same role.',
    idempotent: true,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'File or folder ID from Search or List Folder Contents. Or use Path.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Path from the drive root. Use this or Item ID.',
      placeholder: 'Documents/report.docx',
      required: false,
    }),
    permissionId: Property.ShortText({
      displayName: 'Permission ID',
      description: 'The ID of the permission to change, from List File Permissions.',
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'The new role. Replaces the roles the permission has today.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Read', value: 'read' },
          { label: 'Write', value: 'write' },
        ],
      },
    }),
  },
  async run(context) {
    const { itemId, path, permissionId, role } = context.propsValue;
    try {
      const permission = await oneDriveApi.request<GraphPermission>({
        auth: context.auth,
        method: HttpMethod.PATCH,
        path: `${oneDriveApi.itemPath({ itemId, path })}/permissions/${encodeURIComponent(permissionId.trim())}`,
        body: { roles: [role] },
      });
      return toPermission(permission);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `${message} If this permission is inherited from a parent folder (inherited is true in List File Permissions), change it on that folder instead.`,
      );
    }
  },
});

function toPermission(permission: GraphPermission): OneDrivePermission {
  const grantee = permission.grantedToV2?.user ?? permission.grantedTo?.user;
  const identities = permission.grantedToIdentitiesV2 ?? permission.grantedToIdentities ?? [];
  return {
    id: permission.id,
    roles: permission.roles ?? [],
    linkType: permission.link?.type ?? null,
    linkScope: permission.link?.scope ?? null,
    linkWebUrl: permission.link?.webUrl ?? null,
    linkPreventsDownload: permission.link?.preventsDownload ?? null,
    grantedToName: grantee?.displayName ?? null,
    grantedToEmail: grantee?.email ?? null,
    grantedToId: grantee?.id ?? null,
    grantedToIdentities: identities
      .flatMap((identity) => {
        const value = identity.user?.email ?? identity.user?.displayName;
        return value ? [value] : [];
      })
      .join(', '),
    invitationEmail: permission.invitation?.email ?? null,
    inherited: permission.inheritedFrom !== undefined,
    inheritedFromId: permission.inheritedFrom?.id ?? null,
    inheritedFromPath: permission.inheritedFrom?.path ?? null,
    hasPassword: permission.hasPassword ?? null,
    expirationDateTime: permission.expirationDateTime ?? null,
    shareId: permission.shareId ?? null,
  };
}

type GraphPermissionUser = { displayName?: string; email?: string; id?: string };

type GraphPermission = {
  id: string;
  roles?: string[];
  link?: { type?: string; scope?: string; webUrl?: string; preventsDownload?: boolean };
  grantedTo?: { user?: GraphPermissionUser };
  grantedToV2?: { user?: GraphPermissionUser };
  grantedToIdentities?: { user?: GraphPermissionUser }[];
  grantedToIdentitiesV2?: { user?: GraphPermissionUser }[];
  invitation?: { email?: string };
  inheritedFrom?: { id?: string; path?: string; driveId?: string };
  hasPassword?: boolean;
  expirationDateTime?: string;
  shareId?: string;
};

type OneDrivePermission = {
  id: string;
  roles: string[];
  linkType: string | null;
  linkScope: string | null;
  linkWebUrl: string | null;
  linkPreventsDownload: boolean | null;
  grantedToName: string | null;
  grantedToEmail: string | null;
  grantedToId: string | null;
  grantedToIdentities: string;
  invitationEmail: string | null;
  inherited: boolean;
  inheritedFromId: string | null;
  inheritedFromPath: string | null;
  hasPassword: boolean | null;
  expirationDateTime: string | null;
  shareId: string | null;
};
