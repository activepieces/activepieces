import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCopyFolderOutputSchema } from '../../../output-schemas';

const CLEARABLE = ['description', 'tags'];
const SYNC_STATES = ['synced', 'not_synced', 'partially_synced'];

export const updateFolderAction = createAction({
  auth: boxAuth,
  name: 'box_update_folder',
  outputSchema: boxCopyFolderOutputSchema,
  displayName: 'Update Folder',
  description: 'Renames, moves or changes the details of a Box folder.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a Box folder\'s name, description, parent folder (a move), tags or collaboration settings; only the fields given change. Tags replace the current list. Use Set Folder Shared Link for shared links. The root folder "0" cannot be changed. Get the ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    folderId: boxAiProps.folderId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New folder name. Must be unique in its parent folder.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New description, up to 256 characters.',
      required: false,
    }),
    parentFolderId: boxAiProps.folderId({
      required: false,
      displayName: 'Parent Folder ID',
      description: 'ID of the folder to move this folder into.',
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The full new list of tags. It replaces the current tags.',
      required: false,
    }),
    syncState: Property.StaticDropdown({
      displayName: 'Sync State',
      description: 'Whether Box Drive syncs the folder: "synced", "not_synced" or "partially_synced".',
      required: false,
      options: { options: SYNC_STATES.map((value) => ({ label: value, value })) },
    }),
    canNonOwnersInvite: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Can Non-Owners Invite',
      description: '"true" or "false": whether editors may invite collaborators.',
    }),
    canNonOwnersViewCollaborators: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Can Non-Owners View Collaborators',
      description: '"true" or "false": whether non-owners see the collaborator list. "false" also needs Can Non-Owners Invite "false".',
    }),
    isCollaborationRestrictedToEnterprise: boxAiProps.booleanFlag({
      required: false,
      displayName: 'Restrict Collaboration to Enterprise',
      description: '"true" or "false": whether new collaborators must be in your enterprise.',
    }),
    clearFields: Property.StaticMultiSelectDropdown({
      displayName: 'Clear Fields',
      description: 'Fields to empty: "description" and/or "tags". Do not also give a value for a field you clear.',
      required: false,
      options: { options: CLEARABLE.map((field) => ({ label: field, value: field })) },
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Other Box folder fields to set, e.g. {"folder_upload_email": {"access": "open"}} or {"collections": [{"id": "123"}]}.',
      required: false,
    }),
    etag: boxAiProps.etag({
      required: false,
      description: "The folder's last seen etag (from Get Folder). The update fails with 412 if the folder changed since.",
    }),
    fields: boxAiProps.fields({ required: false }),
  },
  async run({ auth, propsValue }) {
    const clear = propsValue.clearFields ?? [];
    const tags = propsValue.tags?.length ? propsValue.tags.map(String) : undefined;
    if (clear.includes('description') && propsValue.description !== undefined) {
      throw new Error('Give either Description or "description" in Clear Fields, not both.');
    }
    if (clear.includes('tags') && tags !== undefined) {
      throw new Error('Give either Tags or "tags" in Clear Fields, not both.');
    }
    if (propsValue.syncState !== undefined && !SYNC_STATES.includes(propsValue.syncState)) {
      throw new Error(`Sync State must be one of: ${SYNC_STATES.join(', ')}.`);
    }
    const body = {
      ...(propsValue.additionalFields ?? {}),
      ...(propsValue.name !== undefined ? { name: propsValue.name } : {}),
      ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
      ...(clear.includes('description') ? { description: '' } : {}),
      ...(propsValue.parentFolderId !== undefined ? { parent: { id: propsValue.parentFolderId } } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(clear.includes('tags') ? { tags: [] } : {}),
      ...(propsValue.syncState !== undefined ? { sync_state: propsValue.syncState } : {}),
      ...(propsValue.canNonOwnersInvite !== undefined
        ? { can_non_owners_invite: propsValue.canNonOwnersInvite === 'true' }
        : {}),
      ...(propsValue.canNonOwnersViewCollaborators !== undefined
        ? { can_non_owners_view_collaborators: propsValue.canNonOwnersViewCollaborators === 'true' }
        : {}),
      ...(propsValue.isCollaborationRestrictedToEnterprise !== undefined
        ? { is_collaboration_restricted_to_enterprise: propsValue.isCollaborationRestrictedToEnterprise === 'true' }
        : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Give at least one field to update.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/folders/${encodeURIComponent(propsValue.folderId)}`,
      query: { fields: propsValue.fields },
      headers: propsValue.etag ? { 'if-match': propsValue.etag } : undefined,
      body,
    });
  },
});
