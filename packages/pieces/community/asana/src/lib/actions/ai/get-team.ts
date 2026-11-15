import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaTeamOutputSchema } from '../../output-schemas';

export const asanaGetTeamAction = createAction({
  auth: asanaAuth,
  name: 'get_team',
  classification: 'READ',
  displayName: 'Get Team',
  description: 'Get an Asana team.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one team: name, description, visibility, endorsed flag, organization and link. Use List Teams or List User Teams to find team gids, and List Team Memberships or List Users (with a team) for its members. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTeamOutputSchema,
  props: {
    team: Property.ShortText({
      displayName: 'Team GID',
      description: 'Gid of the team. Obtain it from List Teams or List User Teams.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/teams/${asanaUtils.pathSegment(context.propsValue.team)}`,
      operation: 'Get Team',
      query: { opt_fields: ASANA_FIELDS.teamFull },
    });
  },
});
