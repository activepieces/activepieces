import { createAction } from '@activepieces/pieces-framework';
import { cmsAuth } from '../../auth';
import { totalcmsOperations } from '../../common/operations';
import { totalcmsProps } from '../../common/props';
import { totalcmsOutputSchemas } from '../../output-schemas';

export const findObjectsByIdAction = createAction({
  name: 'find_objects_by_id',
  classification: 'SEARCH',
  auth: cmsAuth,
  displayName: 'Find Objects (by Collection ID)',
  description: 'Searches, filters and sorts the objects of a collection.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches a Total CMS collection, given its ID (from List Collections), by full-text search, include/exclude filters (e.g. draft:false, price:lte:100) and sort (e.g. -created), returning up to 100 objects with total, has_more and next_offset for paging. Returns index fields only; use Get Object (by ID) for long fields such as blog content. Read-only.',
    idempotent: true,
  },
  props: {
    collection: totalcmsProps.collectionIdText(),
    ...totalcmsOperations.findProps(),
  },
  outputSchema: totalcmsOutputSchemas.find,
  async run(context) {
    return totalcmsOperations.findObjects({ auth: context.auth, input: context.propsValue });
  },
});
