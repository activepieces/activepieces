import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, ASANA_TEAM_VISIBILITY_OPTIONS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaTeamOutputSchema } from '../../output-schemas';

export const asanaCreateTeamAction = createAction({
  auth: asanaAuth,
  name: 'create_team',
  classification: 'WRITE',
  displayName: 'Create Team',
  description: 'Create a team in an Asana organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new team in an organization and returns it; the connected user becomes a member. Teams exist only in organizations (company-domain workspaces), so a plain workspace fails. Check List Teams first to avoid duplicates: each call creates a separate team, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: asanaTeamOutputSchema,
  props: {
    organization: Property.ShortText({
      displayName: 'Organization (Workspace) GID',
      description: 'Gid of the organization, for example 1201234567890123. Obtain it from List Workspaces (is_organization must be true).',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Team Name',
      description: 'Name of the new team, for example "Marketing".',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Plain-text description of the team.',
      required: false,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'Who in the organization can see and join the team. Leave empty for the Asana default.',
      required: false,
      options: { disabled: false, options: ASANA_TEAM_VISIBILITY_OPTIONS },
    }),
  },
  async run(context) {
    const { organization, name, description, visibility } = context.propsValue;
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/teams',
      operation: 'Create Team',
      query: { opt_fields: ASANA_FIELDS.teamFull },
      data: {
        organization: organization.trim(),
        name,
        ...(asanaUtils.hasValue(description) ? { description } : {}),
        ...(asanaUtils.hasValue(visibility) ? { visibility } : {}),
      },
    });
  },
});
