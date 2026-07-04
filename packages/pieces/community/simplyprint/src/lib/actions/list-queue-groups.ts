import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { QueueGroup } from '../common/types';

export const listQueueGroupsAction = createAction({
  auth: simplyprintAuth,
  name: 'list_queue_groups',
  displayName: 'List Queue Groups',
  description: 'List every queue group on your account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Read-only listing of every queue group on the account. Pick this to discover available queue groups and their IDs (e.g. to feed a group ID into List Queue Items or Save Queue Group); it takes no inputs and never modifies anything.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const res = await simplyprintClient.simplyprintCall<{ data: QueueGroup[] }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: 'queue/groups/Get',
    });
    return (res.data ?? []) as QueueGroup[];
  },
});
