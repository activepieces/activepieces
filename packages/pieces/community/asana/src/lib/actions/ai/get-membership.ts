import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaMembershipOutputSchema } from '../../output-schemas';

export const asanaGetMembershipAction = createAction({
  auth: asanaAuth,
  name: 'get_membership',
  classification: 'READ',
  displayName: 'Get Membership',
  description: 'Get one membership of a project, goal or portfolio.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one membership by gid: the member (user or team), the parent (project, goal, portfolio or custom field) and the access level. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaMembershipOutputSchema,
  props: {
    membership: Property.ShortText({
      displayName: 'Membership GID',
      description: 'Gid of the membership. Obtain it from List Memberships or Create Membership.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/memberships/${asanaUtils.pathSegment(context.propsValue.membership)}`,
      operation: 'Get Membership',
    });
  },
});
