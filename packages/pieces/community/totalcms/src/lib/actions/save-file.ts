import { createAction, Property } from '@activepieces/pieces-framework';
import { saveFile } from '../api';
import { cmsAuth } from '../auth';

export const saveFileAction = createAction({
  name: 'save_file',
  auth: cmsAuth,
  displayName: 'Save File',
  description: 'Save file to Total CMS',
  audience: 'both',
  aiMetadata: { description: 'Uploads a single file to a file-type CMS field in Total CMS, identified by its CMS ID (slug), with an explicit file extension. Use to set or replace the file stored at a given CMS ID. Idempotent: the field holds one file keyed on the slug, so repeating with the same input replaces it.', idempotent: true },
  props: {
    slug: Property.ShortText({
      displayName: 'CMS ID',
      description: 'The CMS ID of the file to save',
      required: true,
    }),
    ext: Property.ShortText({
      displayName: 'File Extension',
      description: 'The file extension of the file',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to save',
      required: true,
    }),
  },
  async run(context) {
    const slug = context.propsValue.slug;
    const file = {
      filename: context.propsValue.file.filename,
      base64: context.propsValue.file.base64,
    };
    return await saveFile(context.auth, slug, file, {
      ext: context.propsValue.ext,
    });
  },
});
