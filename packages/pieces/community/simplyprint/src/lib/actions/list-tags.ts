import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { Tag } from '../common/types';

export const listTagsAction = createAction({
  auth: simplyprintAuth,
  name: 'list_tags',
  displayName: 'List Tags',
  description: 'List all custom tags configured on your account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every custom tag configured on the account. Use to discover tag IDs/names before filtering or attaching tags, or to delete one via "Delete Tag". Takes no input; returns an empty list when the account has no custom tags. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    try {
      const res = await simplyprintClient.simplyprintCall<{ tags: Tag[] }>({
        auth: context.auth,
        method: HttpMethod.GET,
        path: 'tags/Get',
      });
      return (res.tags ?? []) as Tag[];
    } catch (e) {
      // `tags/Get` returns status:false when the account has no custom tags;
      // surface an empty list instead of throwing.
      if (/no custom tags/i.test((e as Error).message ?? '')) return [];
      throw e;
    }
  },
});
