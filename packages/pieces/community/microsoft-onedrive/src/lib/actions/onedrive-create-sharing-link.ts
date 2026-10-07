import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveApi } from '../common/graph-api';
import { onedrivePermissionOutputSchema } from '../output-schemas';

export const onedriveCreateSharingLink = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_create_sharing_link',
  displayName: 'Create Sharing Link',
  description: 'Create a view, edit or embed sharing link for a OneDrive file or folder.',
  audience: 'ai',
  outputSchema: onedrivePermissionOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates (or returns the existing) sharing link of the given type and scope for a file or folder, keeping its existing inherited access. Use it to get a URL anyone or an organization can open; to grant access to specific people by email use Share with People (Invite) instead. Embed links and passwords work on personal OneDrive only, and tenant policy may block anonymous links; calling again with the same type and scope returns the same link.',
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
    type: Property.StaticDropdown({
      displayName: 'Link Type',
      description: 'View, Edit, or Embed (Embed is personal OneDrive only).',
      required: true,
      defaultValue: 'view',
      options: {
        disabled: false,
        options: [
          { label: 'View', value: 'view' },
          { label: 'Edit', value: 'edit' },
          { label: 'Embed (personal OneDrive only)', value: 'embed' },
        ],
      },
    }),
    scope: Property.StaticDropdown({
      displayName: 'Scope',
      description: 'Who can open the link. Leave empty for the account default.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Anyone with the link', value: 'anonymous' },
          { label: 'People in my organization', value: 'organization' },
          { label: 'Existing users only', value: 'users' },
        ],
      },
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description: 'Optional password required to open the link. Personal OneDrive only.',
      required: false,
    }),
    expirationDateTime: Property.DateTime({
      displayName: 'Expiration',
      description: 'Optional date and time after which the link stops working.',
      required: false,
    }),
  },
  async run(context) {
    const { itemId, path, type, scope, password, expirationDateTime } = context.propsValue;
    const body: Record<string, unknown> = {
      type,
      retainInheritedPermissions: true,
    };
    if (scope) {
      body['scope'] = scope;
    }
    if (password) {
      body['password'] = password;
    }
    if (expirationDateTime) {
      body['expirationDateTime'] = expirationDateTime;
    }
    try {
      const permission = await oneDriveApi.request<GraphPermission>({
        auth: context.auth,
        method: HttpMethod.POST,
        path: `${oneDriveApi.itemPath({ itemId, path })}/createLink`,
        body,
      });
      return toPermission(permission);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (oneDriveApi.statusOf(error) === 403) {
        throw new Error(
          `OneDrive refused to create a ${scope ?? 'default-scope'} ${type} link. Your organization's sharing policy may block this link type or scope (anonymous links are often disabled), or the account type does not support it (embed and passwords are personal-only). Try a narrower scope such as "users". Details: ${message}`,
        );
      }
      throw error;
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
