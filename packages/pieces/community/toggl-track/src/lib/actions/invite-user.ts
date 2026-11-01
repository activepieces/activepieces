import { createAction, Property } from '@activepieces/pieces-framework';
import { togglTrackAuth } from '../auth';
import { togglCommon } from '../common';
import { togglApi } from '../common/client';
import { togglOutputSchemas } from '../output-schemas';

export const inviteUser = createAction({
  auth: togglTrackAuth,
  name: 'invite_user',
  classification: 'WRITE',
  displayName: 'Invite User to Organization',
  description: 'Invite someone by email to an organization and workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends a Toggl invitation email to one address for the given workspace. Classic only. Returns the created invitations and messages. A retry can send another email.',
    idempotent: false,
  },
  props: {
    organization_id: togglCommon.organization_id,
    workspace_id: togglCommon.workspace_id,
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address to invite.',
      required: true,
    }),
    admin: Property.Checkbox({
      displayName: 'Workspace Admin',
      description: 'Make the invited user an admin of the workspace.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: togglOutputSchemas.invitation,
  async run(context) {
    const auth = context.auth;
    if (togglApi.isTwo(auth)) {
      throw togglApi.classicOnlyError('Invite User to Organization');
    }
    const email = context.propsValue.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Email must be a valid email address.');
    }
    const organizationId = togglApi.requireId({
      value: context.propsValue.organization_id,
      label: 'Organization',
    });
    const workspaceId = togglApi.requireId({
      value: context.propsValue.workspace_id,
      label: 'Workspace',
    });
    const result = await togglApi.request<{
      invitations?: unknown[] | null;
      messages?: unknown[] | null;
    } | null>({
      auth,
      method: togglApi.HttpMethod.POST,
      path: `/organizations/${organizationId}/invitations`,
      body: {
        emails: [email],
        workspaces: [
          { workspace_id: workspaceId, admin: context.propsValue.admin ?? false },
        ],
      },
    });
    return {
      invitations: result?.invitations ?? [],
      messages: result?.messages ?? [],
    };
  },
});
