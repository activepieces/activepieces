import { createAction } from '@activepieces/pieces-framework';
import { hedyAuth } from '../../auth';
import { HedyApiClient } from '../../common/client';
import { commonProps } from '../../common/props';
import { topicDropdown } from '../../common/load-options';
import { Highlight } from '../../common/types';
import { assertLimit } from '../../common/validation';

export const listHighlights = createAction({
  auth: hedyAuth,
  name: 'list-highlights',
  displayName: 'List Highlights',
  description: 'Retrieve highlights with optional topic filtering and pagination.',
  props: {
    returnAll: commonProps.returnAll,
    limit: commonProps.limit,
    format: commonProps.format,
    topicId: topicDropdown,
    after: commonProps.afterCursor,
    before: commonProps.beforeCursor,
  },
  async run(context) {
    const client = new HedyApiClient(context.auth as string);
    const { returnAll, limit, format, topicId, after, before } = context.propsValue as {
      returnAll?: boolean;
      limit?: number;
      format?: 'standard' | 'zapier';
      topicId?: string;
      after?: string;
      before?: string;
    };

    return client.paginate<Highlight>('/highlights', {
      returnAll: Boolean(returnAll),
      limit: assertLimit(limit),
      format,
      topicId,
      after,
      before,
    });
  },
});
