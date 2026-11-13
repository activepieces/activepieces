import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsProps } from '../common/props';
import { totalcmsShape } from '../common/shape';
import { totalcmsUpload } from '../common/upload';
import { totalcmsOutputSchemas } from '../output-schemas';

export const saveImageAction = createAction({
  name: 'save_image',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Save Image',
  description: 'Uploads an image to an image object, replacing the current image.',
  audience: 'both',
  aiMetadata: {
    description:
      'Uploads an image (file or public URL) to a Total CMS image object, replacing its current image and creating the object if the ID is new. Optional alt text is saved with it. Running it again with the same image leaves the same result.',
    idempotent: true,
  },
  props: {
    collection: totalcmsProps.collectionForSchema({ schema: 'image', label: 'Image' }),
    object_id: totalcmsProps.objectIdText({ description: 'The ID of the image object. A new ID creates the object.' }),
    ...totalcmsUpload.fileProps({ fileLabel: 'Image' }),
    alt: totalcmsUpload.altProp(),
  },
  outputSchema: totalcmsOutputSchemas.image,
  async run(context) {
    const collection = totalcmsShape.requireId({ value: context.propsValue.collection, label: 'Collection ID' });
    const id = totalcmsShape.requireId({ value: context.propsValue.object_id, label: 'Object ID' });
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
