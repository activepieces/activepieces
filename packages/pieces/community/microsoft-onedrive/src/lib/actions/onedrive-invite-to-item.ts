import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oneDriveAuth } from '../auth';
import { oneDriveApi } from '../common/graph-api';
import { onedriveInviteToItemOutputSchema } from '../output-schemas';

export const onedriveInviteToItem = createAction({
  auth: oneDriveAuth,
  name: 'onedrive_invite_to_item',
  displayName: 'Share with People (Invite)',
  description: 'Grant specific people read or write access to a OneDrive file or folder.',
  audience: 'ai',
  outputSchema: onedriveInviteToItemOutputSchema,
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Grants read or write access on a file or folder to specific people by email, keeping existing inherited access and requiring them to sign in. Use it for per-person sharing; for a link anyone or the organization can open use Create Sharing Link. No email is sent unless Send Invitation Email is true, and the root folder of a personal drive cannot be shared.',
    idempotent: false,
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
    recipients: Property.Array({
      displayName: 'Recipient Emails',
      description: 'Email addresses of the people to share with.',
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'Read lets recipients view, Write lets them edit.',
      required: true,
      defaultValue: 'read',
      options: {
        disabled: false,
        options: [
          { label: 'Read', value: 'read' },
          { label: 'Write', value: 'write' },
        ],
      },
    }),
    sendInvitation: Property.Checkbox({
      displayName: 'Send Invitation Email',
      description: 'If on, OneDrive emails each recipient. Off grants access silently.',
      required: false,
      defaultValue: false,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Message for the invitation email (only sent when emails are on).',
      required: false,
    }),
  },
  async run(context) {
    const { itemId, path, recipients, role, sendInvitation, message } = context.propsValue;
    const emails = (recipients ?? []).flatMap((recipient) =>
      typeof recipient === 'string' && recipient.trim() ? [recipient.trim()] : [],
    );
    if (emails.length === 0) {
      throw new Error('Provide at least one recipient email address.');
    }
    const body: Record<string, unknown> = {
      recipients: emails.map((email) => ({ email })),
      roles: [role],
      requireSignIn: true,
      sendInvitation: sendInvitation === true,
      retainInheritedPermissions: true,
    };
    if (message) {
      body['message'] = message;
    }
    const response = await oneDriveApi.request<{ value?: GraphPermission[] }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `${oneDriveApi.itemPath({ itemId, path })}/invite`,
      body,
    });
    const permissions = (response.value ?? []).map(toPermission);
    return {
      permissions,
      count: permissions.length,
      invitationSent: sendInvitation === true,
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
