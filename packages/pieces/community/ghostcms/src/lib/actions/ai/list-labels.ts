import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostListLabelsOutputSchema } from '../../output-schemas';

export const ghostListLabels = createAction({
  auth: ghostAuth,
  name: 'ghost_list_labels',
  outputSchema: ghostListLabelsOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Labels',
  description: 'List member labels.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists member labels (not post tags) with member counts and pagination totals. Use it to find the label ID that Add Member Label and Remove Member Label need.',
    idempotent: true,
  },
  props: {
    filter: ghostProps.filter("name:~'vip'"),
    limit: ghostProps.limit,
    page: ghostProps.page,
    order: ghostProps.order('name asc'),
  },
  async run(context) {
    return ghostResource.list(context.auth, 'labels', {
      ...ghostCommon.listQuery(context.propsValue),
      include: 'count.members',
    });
  },
});
