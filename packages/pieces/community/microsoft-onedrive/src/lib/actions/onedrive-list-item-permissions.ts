import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveApi } from '../common/graph-api';
import { onedriveListItemPermissionsOutputSchema } from '../output-schemas';

export const onedriveListItemPermissions = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_list_item_permissions',
  displayName: 'List File Permissions',
  description: 'List who has access to a OneDrive file or folder, including sharing links.',
  audience: 'ai',
  outputSchema: onedriveListItemPermissionsOutputSchema,
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the permissions on a file or folder: owner, per-person grants, sharing links and access inherited from parent folders. Use it to find the permission ID that Update Permission Role and Remove Permission need; permissions marked inherited can only be changed on the folder they are inherited from.',
    idempotent: true,
  },
  props: {
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description:
        'The ID of the file or folder, from Search Files and Folders or List Folder Contents. Provide either this or Path.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The item path relative to the drive root, e.g. `Documents/report.docx`. Provide either this or Item ID.',
      required: false,
    }),
    pageToken: Property.ShortText({
      displayName: 'Page Token',
      description: 'The nextPageToken from a previous call, to fetch the next page. Leave empty for the first page.',
      required: false,
    }),
  },
  async run(context) {
    const { itemId, path, pageToken } = context.propsValue;
    const response = await oneDriveApi.request<{ value?: GraphPermission[]; '@odata.nextLink'?: string }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: pageToken?.trim() ? pageToken.trim() : `${oneDriveApi.itemPath({ itemId, path })}/permissions`,
    });
    const items = (response.value ?? []).map(toPermission);
    return {
      items,
      count: items.length,
      nextPageToken: response['@odata.nextLink'] ?? null,
    };
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
