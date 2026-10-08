import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsProps } from '../common/props';
import { totalcmsShape } from '../common/shape';
import { totalcmsUpload } from '../common/upload';
import { totalcmsOutputSchemas } from '../output-schemas';

export const saveBlogImageAction = createAction({
  name: 'save_blog_image',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Set Blog Post Image',
  description: 'Uploads the main image of a blog post, replacing the current one.',
  audience: 'human',
  aiMetadata: {
    description:
      'Uploads the main image (file or public URL) of an existing Total CMS blog post, replacing the current image. Optional alt text is saved with it. Running it again with the same image leaves the same result.',
    idempotent: true,
  },
  props: {
    collection: totalcmsProps.collection({ displayName: 'Blog', description: 'The blog collection.', schemas: ['blog'] }),
    object_id: totalcmsProps.object({ displayName: 'Post', description: 'The blog post to update.' }),
    ...totalcmsUpload.fileProps({ fileLabel: 'Image' }),
    alt: totalcmsUpload.altProp(),
  },
  outputSchema: totalcmsOutputSchemas.blogPostUpload,
  async run(context) {
    const collection = totalcmsShape.requireId({ value: context.propsValue.collection, label: 'Collection' });
    const id = totalcmsShape.requireId({ value: context.propsValue.object_id, label: 'Post' });
    const result = await totalcmsUpload.save({
      auth: context.auth,
      collection,
      id,
      property: 'image',
      file: context.propsValue.file,
      fileUrl: context.propsValue.file_url,
      alt: context.propsValue.alt ?? undefined,
      multiple: false,
    });
    return { ...totalcmsShape.typed({ collection, object: result.object }), preview_url: result.preview_url, warning: result.warning };
  },
});
