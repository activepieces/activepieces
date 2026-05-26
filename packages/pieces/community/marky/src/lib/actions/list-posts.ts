import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyClient } from '../common/client';
import { markyProps } from '../common/props';
import { markyUtils } from '../common/utils';

const listPostsAction = createAction({
  auth: markyAuth,
  name: 'list-posts',
  displayName: 'List Posts',
  description: 'List posts for a Marky business, newest first. Uses cursor pagination.',
  props: {
    businessId: markyProps.business(),
    status: markyProps.postStatus(),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of posts to return (max 100, default 20).',
      required: false,
      defaultValue: 20,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Pagination cursor returned by a previous call (next_cursor).',
      required: false,
    }),
  },
  async run(context) {
    const businessId = markyUtils.getRequiredString({
      value: context.propsValue.businessId,
      fieldName: 'Business',
    });
    const status = markyUtils.getOptionalString({
      value: context.propsValue.status,
    });
    const limit = markyUtils.getOptionalPositiveInteger({
      value: context.propsValue.limit,
      fieldName: 'Limit',
    });
    const cursor = markyUtils.getOptionalString({
      value: context.propsValue.cursor,
    });

    const result = await markyClient.listPosts({
      apiKey: context.auth.secret_text,
      businessId,
      status,
      limit,
      cursor,
    });

    if (!result.ok) {
      throw new Error(`Failed to list posts: ${result.message}`);
    }

    return result.data;
  },
});

export { listPostsAction };
