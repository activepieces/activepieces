import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../../common/auth';
import { makeRequest } from '../../common/client';
import { aiResults } from '../../common/ai-props';
import { cloudinaryRenameFolderOutputSchema } from '../../output-schemas';

export const cloudinaryRenameFolder = createAction({
  auth: cloudinaryAuth,
  name: 'cloudinary_rename_folder',
  outputSchema: cloudinaryRenameFolderOutputSchema,
  displayName: 'Rename Folder',
  description: 'Renames or moves a folder, together with all its assets and subfolders.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Renames or moves a folder and everything in it to a new path (dynamic folder mode). Public IDs and delivery URLs of the assets do not change. Not idempotent: a second call fails because the source path no longer exists.',
    idempotent: false,
  },
  props: {
    folder: Property.ShortText({
      displayName: 'Folder Path',
      description: 'Full folder path (e.g. "marketing/banners").',
      required: true,
    }),
    to_folder: Property.ShortText({
      displayName: 'New Folder Path',
      description: 'The new full path (e.g. "marketing/archive/banners").',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, HttpMethod.PUT, `/folders/${aiResults.encodePath({ value: propsValue.folder })}`, {
      to_folder: propsValue.to_folder.trim(),
    });
  },
});
