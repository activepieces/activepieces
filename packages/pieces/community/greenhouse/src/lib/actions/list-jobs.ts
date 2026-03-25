import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { greenhouseAuth } from '../auth';
import { greenhouseRequest } from '../common/client';
import { paginationProps, statusProp } from '../common/props';

export const listJobsAction = createAction({
  name: 'list_jobs',
  displayName: 'List Jobs',
  description: 'List Greenhouse jobs from the Harvest API.',
  auth: greenhouseAuth,
  props: {
    status: statusProp,
    createdAfter: Property.ShortText({
      displayName: 'Created After',
      description: 'Optional ISO-8601 timestamp filter.',
      required: false,
    }),
    updatedAfter: Property.ShortText({
      displayName: 'Updated After',
      description: 'Optional ISO-8601 timestamp filter.',
      required: false,
    }),
    ...paginationProps,
  },
  async run({ auth, propsValue }) {
    return greenhouseRequest({
      auth,
      method: HttpMethod.GET,
      path: '/jobs',
      queryParams: {
        ...(propsValue.status ? { status: propsValue.status } : {}),
        ...(propsValue.createdAfter
          ? { created_after: String(propsValue.createdAfter) }
          : {}),
        ...(propsValue.updatedAfter
          ? { updated_after: String(propsValue.updatedAfter) }
          : {}),
        ...(propsValue.perPage !== undefined
          ? { per_page: String(propsValue.perPage) }
          : {}),
        ...(propsValue.page !== undefined ? { page: String(propsValue.page) } : {}),
        ...(propsValue.skipCount ? { skip_count: 'true' } : {}),
      },
    });
  },
});
