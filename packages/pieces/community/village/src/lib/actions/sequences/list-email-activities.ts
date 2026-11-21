import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const listEmailActivities = createAction({
  auth: villageAuth,
  name: 'list_email_activities',
  classification: 'SEARCH',
  displayName: 'List Email Activities',
  description: 'List sequence email activities (incoming, outgoing, notes) and their approval decision. Free.',
  audience: 'human',
  aiMetadata: { description: 'Lists sequence email activities, optionally by decision. Read-only.', idempotent: true },
  outputSchema: villageSchemas.listEmailActivities,
  props: {
    decision: Property.StaticDropdown({
      displayName: 'Decision',
      required: false,
      options: {
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ],
      },
    }),
  },
  async run(context) {
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/sequences/activities',
      queryParams: { decision: context.propsValue.decision ?? undefined },
    });
  },
});
