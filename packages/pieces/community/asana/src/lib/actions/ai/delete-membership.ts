import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaDeleteMembershipOutputSchema } from '../../output-schemas';

export const asanaDeleteMembershipAction = createAction({
  auth: asanaAuth,
  name: 'delete_membership',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Membership',
  description: 'Revoke a user\'s or team\'s access to a project, goal or portfolio.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes one membership, revoking that user\'s or team\'s access to the project, goal or portfolio. Access can only come back through a new membership. Not idempotent: repeating the call on the same membership fails.',
    idempotent: false,
  },
  outputSchema: asanaDeleteMembershipOutputSchema,
  props: {
    membership: Property.ShortText({
      displayName: 'Membership GID',
      description: 'Gid of the membership to delete. Obtain it from List Memberships.',
      required: true,
    }),
  },
  async run(context) {
    const membership = context.propsValue.membership.trim();
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/memberships/${asanaUtils.pathSegment(membership)}`,
      operation: 'Delete Membership',
    });
    return { success: true, membership_gid: membership };
  },
});
