import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateCollaborationOutputSchema } from '../../../output-schemas';

const ITEM_TYPES = ['file', 'folder'];
const COLLABORATOR_TYPES = ['user', 'group'];
const ROLES = ['editor', 'viewer', 'previewer', 'uploader', 'previewer uploader', 'viewer uploader', 'co-owner'];

export const createCollaborationAction = createAction({
  auth: boxAuth,
  name: 'box_create_collaboration',
  outputSchema: boxCreateCollaborationOutputSchema,
  displayName: 'Create Collaboration',
  description: 'Gives a user or group access to a Box file or folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Invites a user (by ID or login email, exactly one) or a group (by ID) to a file or folder with a role, and returns the collaboration ID. Inviting an email outside the enterprise creates a pending invite. Get user IDs from List Users and group IDs from List Groups.',
    idempotent: false,
  },
  props: {
    itemType: Property.StaticDropdown({
      displayName: 'Item Type',
      description: '"file" or "folder".',
      required: true,
      options: { options: ITEM_TYPES.map((value) => ({ label: value, value })) },
    }),
    itemId: Property.ShortText({
      displayName: 'Item ID',
      description: 'ID of the file or folder to share. Get it from List Folder Items or Search.',
      required: true,
    }),
    collaboratorType: Property.StaticDropdown({
      displayName: 'Collaborator Type',
      description: '"user" or "group".',
      required: true,
      options: { options: COLLABORATOR_TYPES.map((value) => ({ label: value, value })) },
    }),
    collaboratorId: Property.ShortText({
      displayName: 'Collaborator ID',
      description: 'ID of the user or group. Give this or Collaborator Login, not both.',
      required: false,
    }),
    collaboratorLogin: Property.ShortText({
      displayName: 'Collaborator Login',
      description: 'Email address of the user to invite; users only. Give this or Collaborator ID, not both.',
      required: false,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'Access level: editor, viewer, previewer, uploader, "previewer uploader", "viewer uploader" or co-owner.',
      required: true,
      options: { options: ROLES.map((value) => ({ label: value, value })) },
    }),
    isAccessOnly: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Access Only',
      description: '"true" to give access without showing the item in the collaborator\'s All Files list.',
    }),
    canViewPath: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Can View Path',
      description: '"true" to let the collaborator see the folder\'s parent path; folders only, owner or co-owner only.',
    }),
    expiresAt: Property.DateTime({
      displayName: 'Expires At',
      description: 'When the collaboration is removed, ISO 8601. Only works if the enterprise allows collaboration expiry.',
      required: false,
    }),
    notify: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Notify',
      description: '"true" or "false": whether to email the collaborator.',
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (!ITEM_TYPES.includes(propsValue.itemType)) {
      throw new Error(`Item Type must be one of: ${ITEM_TYPES.join(', ')}.`);
    }
    if (!COLLABORATOR_TYPES.includes(propsValue.collaboratorType)) {
      throw new Error(`Collaborator Type must be one of: ${COLLABORATOR_TYPES.join(', ')}.`);
    }
    if (!ROLES.includes(propsValue.role)) {
      throw new Error(`Role must be one of: ${ROLES.join(', ')}.`);
    }
    if (Boolean(propsValue.collaboratorId) === Boolean(propsValue.collaboratorLogin)) {
      throw new Error('Give exactly one of Collaborator ID or Collaborator Login.');
    }
    if (propsValue.collaboratorLogin && propsValue.collaboratorType !== 'user') {
      throw new Error('Collaborator Login works only with Collaborator Type "user".');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/collaborations',
      query: { fields: propsValue.fields, notify: propsValue.notify },
      body: {
        item: { type: propsValue.itemType, id: propsValue.itemId },
        accessible_by: {
          type: propsValue.collaboratorType,
          ...(propsValue.collaboratorId ? { id: propsValue.collaboratorId } : { login: propsValue.collaboratorLogin }),
        },
        role: propsValue.role,
        ...(propsValue.isAccessOnly !== undefined ? { is_access_only: propsValue.isAccessOnly === 'true' } : {}),
        ...(propsValue.canViewPath !== undefined ? { can_view_path: propsValue.canViewPath === 'true' } : {}),
        ...(propsValue.expiresAt !== undefined ? { expires_at: propsValue.expiresAt } : {}),
      },
    });
  },
});
