import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsProps } from '../common/props';
import { totalcmsShape } from '../common/shape';
import { totalcmsUpload } from '../common/upload';
import { totalcmsOutputSchemas } from '../output-schemas';

export const saveBlogGalleryAction = createAction({
  name: 'save_blog_gallery',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Add Image to Blog Post Gallery',
  description: 'Adds an image to the gallery of a blog post.',
  audience: 'human',
  aiMetadata: {
    description:
      'Adds one image (file or public URL) to the gallery of an existing Total CMS blog post. Optional alt text is saved on the new image. Each call adds another image, so retries add duplicates.',
    idempotent: false,
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
      property: 'gallery',
      file: context.propsValue.file,
      fileUrl: context.propsValue.file_url,
      alt: context.propsValue.alt ?? undefined,
      multiple: true,
    });
    return { ...totalcmsShape.typed({ collection, object: result.object }), preview_url: result.preview_url, warning: result.warning };
  },
});
