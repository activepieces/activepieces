import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsProps } from '../common/props';
import { totalcmsShape } from '../common/shape';
import { totalcmsUpload } from '../common/upload';
import { totalcmsOutputSchemas } from '../output-schemas';

export const saveFileAction = createAction({
  name: 'save_file',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Save File',
  description: 'Uploads a file to a file object, replacing the current file.',
  audience: 'both',
  aiMetadata: {
    description:
      'Uploads a file (file or public URL) to a Total CMS file object, replacing its current file and creating the object if the ID is new. Use for downloadable documents. Running it again with the same file leaves the same result.',
    idempotent: true,
  },
  props: {
    collection: totalcmsProps.collectionForSchema({ schema: 'file', label: 'File' }),
    object_id: totalcmsProps.objectIdText({ description: 'The ID of the file object. A new ID creates the object.' }),
    ...totalcmsUpload.fileProps({ fileLabel: 'File' }),
  },
  outputSchema: totalcmsOutputSchemas.file,
  async run(context) {
    const collection = totalcmsShape.requireId({ value: context.propsValue.collection, label: 'Collection ID' });
    const id = totalcmsShape.requireId({ value: context.propsValue.object_id, label: 'Object ID' });
    const result = await totalcmsUpload.save({
      auth: context.auth,
      collection,
      id,
      property: 'file',
      file: context.propsValue.file,
      fileUrl: context.propsValue.file_url,
      multiple: false,
    });
    return totalcmsShape.typed({ collection, object: result.object });
  },
});
