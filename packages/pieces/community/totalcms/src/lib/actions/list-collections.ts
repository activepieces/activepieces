import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsApi } from '../common/client';
import { totalcmsOutputSchemas } from '../output-schemas';

export const listCollectionsAction = createAction({
  name: 'list_collections',
  classification: 'SEARCH',
  auth: cmsAuth,
  displayName: 'List Collections',
  description: 'Lists all collections on the site.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every Total CMS collection on the site with its ID, schema (blog, text, image and so on) and object count. Call it first to find the collection ID other actions need. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {},
  outputSchema: totalcmsOutputSchemas.collections,
  async run(context) {
    const collections = await totalcmsApi.listCollections({ auth: context.auth });
    return { collections, count: collections.length };
  },
});
