import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsOperations } from '../common/operations';
import { totalcmsProps } from '../common/props';
import { totalcmsOutputSchemas } from '../output-schemas';

export const uploadFileAction = createAction({
  name: 'upload_file',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Upload File to Field',
  description: 'Uploads a file or image to an image, gallery, file or depot field of an object.',
  audience: 'human',
  aiMetadata: {
    description:
      'Uploads a file (file or public URL) into an image, gallery, file or depot field of an existing Total CMS object. Image and file fields are replaced; gallery and depot fields get one more entry per call, so retries can add duplicates.',
    idempotent: false,
  },
  props: {
    collection: totalcmsProps.collection(),
    object_id: totalcmsProps.object(),
    field: totalcmsProps.schemaField({
      displayName: 'Field',
      description: 'The image, gallery, file or depot field to upload to.',
      fieldTypes: ['image', 'gallery', 'file', 'depot'],
    }),
    ...totalcmsOperations.uploadExtraProps(),
  },
  outputSchema: totalcmsOutputSchemas.upload,
  async run(context) {
    return totalcmsOperations.uploadFile({ auth: context.auth, input: context.propsValue });
  },
});
