import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, ASANA_TEAM_VISIBILITY_OPTIONS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaTeamOutputSchema } from '../../output-schemas';

export const asanaUpdateTeamAction = createAction({
  auth: asanaAuth,
  name: 'update_team',
  classification: 'WRITE',
  displayName: 'Update Team',
  description: 'Change the name, description, visibility or endorsement of an Asana team.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates only the team fields you set (name, description, visibility, endorsed); everything else is left unchanged. Team settings may be limited to team admins. Members are changed with Add User to Team and Remove User from Team. Setting the same values again converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTeamOutputSchema,
  props: {
    team: Property.ShortText({
      displayName: 'Team GID',
      description: 'Gid of the team to update. Obtain it from List Teams or List User Teams.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Team Name',
      description: 'New team name. Leave empty to keep it.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New plain-text description; replaces the current one. Leave empty to keep it.',
      required: false,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'New visibility. Leave empty to keep it.',
      required: false,
      options: { disabled: false, options: ASANA_TEAM_VISIBILITY_OPTIONS },
    }),
    endorsed: asanaProps.optionalBoolean({
      displayName: 'Endorsed',
      description: 'Yes to mark the team as endorsed, No to remove the endorsement. Leave empty to keep it.',
    }),
  },
  async run(context) {
    const { team, name, description, visibility, endorsed } = context.propsValue;
    const data: Record<string, unknown> = {
      ...(asanaUtils.hasValue(name) ? { name } : {}),
      ...(asanaUtils.hasValue(description) ? { description } : {}),
      ...(asanaUtils.hasValue(visibility) ? { visibility } : {}),
      ...(typeof endorsed === 'boolean' ? { endorsed } : {}),
    };
    asanaUtils.assertNotEmpty({ patch: data, fields: 'Team Name, Description, Visibility or Endorsed' });
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/teams/${asanaUtils.pathSegment(team)}`,
      operation: 'Update Team',
      query: { opt_fields: ASANA_FIELDS.teamFull },
      data,
    });
  },
});
