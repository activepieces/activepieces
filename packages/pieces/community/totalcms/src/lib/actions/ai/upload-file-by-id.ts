import { createAction, Property } from '@activepieces/pieces-framework';
import { cmsAuth } from '../../auth';
import { totalcmsOperations } from '../../common/operations';
import { totalcmsProps } from '../../common/props';
import { totalcmsOutputSchemas } from '../../output-schemas';

export const uploadFileByIdAction = createAction({
  name: 'upload_file_by_id',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Upload File to Field (by ID)',
  description: 'Uploads a file or image to an image, gallery, file or depot field of an object.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Uploads a file (public URL or file) into an image, gallery, file or depot field of a Total CMS object, given the collection ID, object ID and field name (from Get Collection Fields (by ID)). Image and file fields are replaced; gallery and depot fields get one more entry per call, so retries can add duplicates.',
    idempotent: false,
  },
  props: {
    collection: totalcmsProps.collectionIdText(),
    object_id: totalcmsProps.objectIdText(),
    field: Property.ShortText({
      displayName: 'Field Name',
      description: 'The image, gallery, file or depot field name, such as image.',
      required: true,
    }),
    ...totalcmsOperations.uploadExtraProps(),
  },
  outputSchema: totalcmsOutputSchemas.upload,
  async run(context) {
    return totalcmsOperations.uploadFile({ auth: context.auth, input: context.propsValue });
  },
});
