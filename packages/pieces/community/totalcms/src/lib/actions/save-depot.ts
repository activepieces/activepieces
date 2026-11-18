import { createAction, Property } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsProps } from '../common/props';
import { totalcmsShape } from '../common/shape';
import { totalcmsUpload } from '../common/upload';
import { totalcmsOutputSchemas } from '../output-schemas';

export const saveDepotAction = createAction({
  name: 'save_depot',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Add File to Depot',
  description: 'Adds a file to a depot (file library) object.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds one file (file or public URL) to a Total CMS depot object, optionally inside a folder, creating the object if the ID is new. Each call adds another file, so retries add duplicates.',
    idempotent: false,
  },
  props: {
    collection: totalcmsProps.collectionForSchema({ schema: 'depot', label: 'Depot' }),
    object_id: totalcmsProps.objectIdText({ description: 'The ID of the depot object. A new ID creates the object.' }),
    ...totalcmsUpload.fileProps({ fileLabel: 'File' }),
    folder: Property.ShortText({
      displayName: 'Folder',
      description: 'Optional folder path inside the depot, such as 2026/reports.',
      required: false,
    }),
  },
  outputSchema: totalcmsOutputSchemas.depot,
  async run(context) {
    const collection = totalcmsShape.requireId({ value: context.propsValue.collection, label: 'Collection ID' });
    const id = totalcmsShape.requireId({ value: context.propsValue.object_id, label: 'Object ID' });
    const result = await totalcmsUpload.save({
      auth: context.auth,
      collection,
      id,
      property: 'depot',
      file: context.propsValue.file,
      fileUrl: context.propsValue.file_url,
      folder: context.propsValue.folder ?? undefined,
      multiple: false,
    });
    return totalcmsShape.typed({ collection, object: result.object });
  },
});
