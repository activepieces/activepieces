import { createAction, Property } from '@activepieces/pieces-framework';
import { saveFile } from '../api';
import { cmsAuth } from '../auth';

export const saveFileAction = createAction({
  name: 'save_file',
  auth: cmsAuth,
  displayName: 'Save File',
  description: 'Save file to Total CMS',
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
