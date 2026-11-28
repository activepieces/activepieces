import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { beamerAuth } from '../../../auth';
import { beamerAiProps } from '../../../common/ai-props';
import { beamerClient } from '../../../common/client';
import type { BeamerCount } from '../../../common/types';
import { beamerUtils } from '../../../common/utils';
import { beamerCountPostCommentsOutputSchema } from '../../../output-schemas';

export const countPostsAction = createAction({
  auth: beamerAuth,
  name: 'beamer_count_posts',
  outputSchema: beamerCountPostCommentsOutputSchema,
  displayName: 'Count Posts',
  description: 'Counts Beamer posts that match the filters.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns how many Beamer posts match the filters, drafts and archived posts included unless filtered out. Use it for totals instead of paging through List Posts.',
    idempotent: true,
  },
  props: {
    published: beamerAiProps.booleanChoice({
      required: false,
      displayName: 'Published',
      description: '"true" counts published posts only, "false" drafts only. Unset counts both.',
    }),
    archived: beamerAiProps.booleanChoice({
      required: false,
      displayName: 'Archived',
      description: '"true" counts archived posts only, "false" non-archived only. Unset counts both.',
    }),
    category: beamerAiProps.category({ required: false }),
    dateFrom: beamerAiProps.dateFrom({ required: false }),
    dateTo: beamerAiProps.dateTo({ required: false }),
  },
  async run({ auth, propsValue }) {
    beamerUtils.checkCategory({ category: propsValue.category });
    return await beamerClient.request<BeamerCount>({
      auth,
      method: HttpMethod.GET,
      path: '/posts/count',
      query: {
        published: propsValue.published,
        archived: propsValue.archived,
        category: propsValue.category,
        dateFrom: propsValue.dateFrom,
        dateTo: propsValue.dateTo,
      },
    });
  },
});
