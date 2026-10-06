import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostListNewslettersOutputSchema } from '../../output-schemas';

export const ghostListNewsletters = createAction({
  auth: ghostAuth,
  name: 'ghost_list_newsletters',
  outputSchema: ghostListNewslettersOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Newsletters',
  description: 'List the newsletters of the publication.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists newsletters with their ID, slug, status and settings. The slug is what Publish Post and Schedule Post need to email a post, and the ID is what the member subscribe actions need. Filter status:active to hide archived ones.',
    idempotent: true,
  },
  props: {
    filter: ghostProps.filter('status:active'),
    limit: ghostProps.limit,
    page: ghostProps.page,
    order: ghostProps.order('sort_order asc'),
  },
  async run(context) {
    return ghostResource.list(context.auth, 'newsletters', ghostCommon.listQuery(context.propsValue));
  },
});
