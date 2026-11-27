import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const ROLES = ['editor', 'viewer', 'previewer', 'uploader', 'previewer uploader', 'viewer uploader', 'co-owner', 'owner'];
const STATUSES = ['pending', 'accepted', 'rejected'];

export const updateCollaborationAction = createAction({
  auth: boxAuth,
  name: 'box_update_collaboration',
  displayName: 'Update Collaboration',
  description: 'Changes the role, status or expiry of a Box collaboration.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a collaboration\'s role, expiry or path visibility, or accepts/rejects a pending invite with Status; only the fields given change. Role "owner" transfers ownership of the item to the collaborator. Get the ID from List File Collaborations, List Folder Collaborations or List Pending Collaborations.',
    idempotent: true,
  },
  props: {
    collaborationId: boxAiProps.collaborationId({ required: true }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'New access level: editor, viewer, previewer, uploader, "previewer uploader", "viewer uploader", co-owner or owner.',
      required: false,
      options: { options: ROLES.map((value) => ({ label: value, value })) },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: '"accepted" or "rejected" to answer a pending invite sent to you.',
      required: false,
      options: { options: STATUSES.map((value) => ({ label: value, value })) },
    }),
    expiresAt: Property.DateTime({
      displayName: 'Expires At',
      description: 'New removal date, ISO 8601. Only works if the enterprise allows collaboration expiry.',
      required: false,
    }),
    canViewPath: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Can View Path',
      description: '"true" or "false": whether the collaborator sees the folder\'s parent path; folders only, owner only.',
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.role !== undefined && !ROLES.includes(propsValue.role)) {
      throw new Error(`Role must be one of: ${ROLES.join(', ')}.`);
    }
    if (propsValue.status !== undefined && !STATUSES.includes(propsValue.status)) {
      throw new Error(`Status must be one of: ${STATUSES.join(', ')}.`);
    }
    const body = {
      ...(propsValue.role !== undefined ? { role: propsValue.role } : {}),
      ...(propsValue.status !== undefined ? { status: propsValue.status } : {}),
      ...(propsValue.expiresAt !== undefined ? { expires_at: propsValue.expiresAt } : {}),
      ...(propsValue.canViewPath !== undefined ? { can_view_path: propsValue.canViewPath === 'true' } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Give at least one field to update.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/collaborations/${encodeURIComponent(propsValue.collaborationId)}`,
      body,
    });
  },
});
