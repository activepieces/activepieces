import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { cloudinaryGetFolderOutputSchema } from '../../output-schemas';

export const cloudinaryGetFolder = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_get_folder',
  outputSchema: cloudinaryGetFolderOutputSchema,
  displayName: 'Get Folder',
  description: 'Gets one folder\'s details by path or by folder ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one folder\'s name, path, external_id, created_at, resource_count, total_bytes, last_uploaded_at and ancestors, looked up by path or by folder external_id (not both). Folder IDs come from List Root Folders, List Subfolders or Search Folders.',
    idempotent: true,
  },
  props: {
    path: Property.ShortText({
      displayName: 'Folder Path',
      description: 'Full folder path. Use either this or Folder ID.',
      required: false,
    }),
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'The folder external_id. Use either this or Folder Path.',
      required: false,
    }),
    case_sensitive: aiProps.includeFlag({ displayName: 'Case Sensitive', description: 'Match the path case-sensitively.' }),
  },
  async run({ auth, propsValue }) {
    const path = propsValue.path?.trim();
    const folderId = propsValue.folder_id?.trim();
    if (Boolean(path) === Boolean(folderId)) {
      throw new Error('Provide either Folder Path or Folder ID, not both.');
    }
    if (path) {
      return makeRequest(auth, HttpMethod.PUT, '/folders/by_path', {
        path,
        ...(propsValue.case_sensitive ? { case_sensitive: true } : {}),
      });
    }
    return makeRequest(auth, HttpMethod.PUT, '/folders/by_id', { id: folderId });
  },
});
