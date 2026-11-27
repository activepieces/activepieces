import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const uploadFileVersionAction = createAction({
  auth: boxAuth,
  name: 'box_upload_file_version',
  displayName: 'Upload File Version',
  description: 'Uploads new content for an existing Box file as a new version.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the content of an existing Box file (up to 50 MB) with a new version, keeping its ID, comments and shared link; past versions stay in List File Versions. Use Upload File for a new file. Get the ID from List Folder Items or Search.',
    idempotent: false,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    file: Property.File({
      displayName: 'File',
      description: 'The new content: a URL or base64 content.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'Renames the file with this upload, with extension. Leave empty to keep the current name.',
      required: false,
    }),
    contentModifiedAt: Property.DateTime({
      displayName: 'Content Modified At',
      description: 'When the content was last modified, ISO 8601. Defaults to the upload time.',
      required: false,
    }),
    etag: boxAiProps.etag({
      required: false,
      description: "The file's last seen etag (from Get File). The upload fails with 412 if the file changed since.",
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.upload({
      auth,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/content`,
      attributes: {
        ...(propsValue.name !== undefined ? { name: propsValue.name } : {}),
        ...(propsValue.contentModifiedAt !== undefined ? { content_modified_at: propsValue.contentModifiedAt } : {}),
      },
      file: propsValue.file.data,
      fileName: propsValue.name ?? propsValue.file.filename,
      headers: propsValue.etag ? { 'if-match': propsValue.etag } : undefined,
    });
  },
});
