import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsProps } from '../common/props';
import { totalcmsShape } from '../common/shape';
import { totalcmsUpload } from '../common/upload';
import { totalcmsOutputSchemas } from '../output-schemas';

export const saveGalleryAction = createAction({
  name: 'save_gallery',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Add Image to Gallery',
  description: 'Adds an image to a gallery object.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds one image (file or public URL) to the end of a Total CMS gallery object, creating the object if the ID is new. Optional alt text is saved on the new image. Each call adds another image, so retries add duplicates.',
    idempotent: false,
  },
  props: {
    collection: totalcmsProps.collectionForSchema({ schema: 'gallery', label: 'Gallery' }),
    object_id: totalcmsProps.objectIdText({ description: 'The ID of the gallery object. A new ID creates the object.' }),
    ...totalcmsUpload.fileProps({ fileLabel: 'Image' }),
    alt: totalcmsUpload.altProp(),
  },
  outputSchema: totalcmsOutputSchemas.gallery,
  async run(context) {
    const collection = totalcmsShape.requireId({ value: context.propsValue.collection, label: 'Collection ID' });
    const id = totalcmsShape.requireId({ value: context.propsValue.object_id, label: 'Object ID' });
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
