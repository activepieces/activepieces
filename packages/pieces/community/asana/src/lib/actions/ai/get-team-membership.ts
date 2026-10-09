import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaTeamMembershipOutputSchema } from '../../output-schemas';

export const asanaGetTeamMembershipAction = createAction({
  auth: asanaAuth,
  name: 'get_team_membership',
  classification: 'READ',
  displayName: 'Get Team Membership',
  description: 'Get one Asana team membership.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one team membership: the user, the team and the is_admin, is_guest and is_limited_access flags. Use List Team Memberships to find membership gids. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTeamMembershipOutputSchema,
  props: {
    team_membership: Property.ShortText({
      displayName: 'Team Membership GID',
      description: 'Gid of the team membership. Obtain it from List Team Memberships or Add User to Team.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/team_memberships/${asanaUtils.pathSegment(context.propsValue.team_membership)}`,
      operation: 'Get Team Membership',
      query: { opt_fields: ASANA_FIELDS.teamMembership },
    });
  },
});
