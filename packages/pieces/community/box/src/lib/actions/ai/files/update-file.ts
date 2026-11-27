import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

const CLEARABLE = ['description', 'tags'];

export const updateFileAction = createAction({
  auth: boxAuth,
  name: 'box_update_file',
  displayName: 'Update File',
  description: 'Renames, moves or changes the details of a Box file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a Box file\'s name, description, parent folder (a move) or tags; only the fields given change. Tags replace the current list. Use Set File Shared Link for shared links and Upload File Version to change the content. Get the ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New file name, with extension. Must be unique in its folder.',
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
      description: 'ID of the folder to move the file into.',
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The full new list of tags. It replaces the current tags.',
      required: false,
    }),
    clearFields: Property.StaticMultiSelectDropdown({
      displayName: 'Clear Fields',
      description: 'Fields to empty: "description" and/or "tags". Do not also give a value for a field you clear.',
      required: false,
      options: { options: CLEARABLE.map((field) => ({ label: field, value: field })) },
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Other Box file fields to set, e.g. {"lock": {"type": "lock", "access": "lock"}} or {"permissions": {"can_download": "company"}}.',
      required: false,
    }),
    etag: boxAiProps.etag({
      required: false,
      description: "The file's last seen etag (from Get File). The update fails with 412 if the file changed since.",
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
    const body = {
      ...(propsValue.additionalFields ?? {}),
      ...(propsValue.name !== undefined ? { name: propsValue.name } : {}),
      ...(propsValue.description !== undefined ? { description: propsValue.description } : {}),
      ...(clear.includes('description') ? { description: '' } : {}),
      ...(propsValue.parentFolderId !== undefined ? { parent: { id: propsValue.parentFolderId } } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(clear.includes('tags') ? { tags: [] } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Give at least one field to update.');
    }
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/files/${encodeURIComponent(propsValue.fileId)}`,
      query: { fields: propsValue.fields },
      headers: propsValue.etag ? { 'if-match': propsValue.etag } : undefined,
      body,
    });
  },
});

