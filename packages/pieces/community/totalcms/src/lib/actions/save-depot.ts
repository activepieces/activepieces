import { createAction, Property } from '@activepieces/pieces-framework';
import { saveDepot } from '../api';
import { cmsAuth } from '../auth';

export const saveDepotAction = createAction({
  name: 'save_depot',
  auth: cmsAuth,
  displayName: 'Save Depot',
  description: 'Save file to Total CMS depot',
  audience: 'both',
  aiMetadata: { description: 'Uploads a file into a Total CMS depot (a multi-file collection), identified by the depot CMS ID (slug). Use to add a document or asset to a depot. Not idempotent: each call appends another file to the depot.', idempotent: false },
  props: {
    slug: Property.ShortText({
      displayName: 'CMS ID',
      description: 'The CMS ID of the depot to save',
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
    return await saveDepot(context.auth, slug, file);
  },
});
