import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, atomicProps, LinearTeamNode } from './common';
import { TEAM_UPDATE_MUTATION } from './queries';
import { atomicTeamOutputSchema } from './output-schemas';

export const linearTeamUpdateAtomic = createAction({
  auth: linearAuth,
  name: 'linear_team_update',
  classification: 'WRITE',
  displayName: 'Update Team (AI)',
  description: 'Change only the team settings you pass (name, key, description, icon, color, timezone, cycles, triage).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Partially updates a Linear team: only the settings you pass change (name, key, description, icon, color, timezone, cycles and triage on or off). Changing the key changes every issue identifier of the team, so only do it when asked. May need an admin key. Idempotent: repeating the same update leaves the team in the same state.',
    idempotent: true,
  },
  props: {
    team_id: Property.ShortText({ displayName: 'Team ID', description: 'UUID of the team. Get it from List Teams.', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    key: Property.ShortText({ displayName: 'Key', description: 'New issue key, for example PLT. Renames every issue identifier of the team.', required: false }),
    description: Property.ShortText({ displayName: 'Description', required: false }),
    icon: Property.ShortText({ displayName: 'Icon', required: false }),
    color: Property.ShortText({ displayName: 'Color', description: 'Hex color, for example #5E6AD2.', required: false }),
    timezone: Property.ShortText({ displayName: 'Timezone', description: 'IANA timezone, for example Europe/Berlin.', required: false }),
    cycles_enabled: atomicProps.triStateProp({ displayName: 'Cycles', description: 'Turn cycles on or off. Leave empty to keep the current setting.' }),
    triage_enabled: atomicProps.triStateProp({ displayName: 'Triage', description: 'Turn triage on or off. Leave empty to keep the current setting.' }),
  },
  outputSchema: atomicTeamOutputSchema,
  async run({ auth, propsValue }) {
    const key = propsValue.key?.trim();
    if (key && !/^[A-Za-z0-9]{1,7}$/.test(key)) {
      throw new Error('Key must be 1 to 7 letters or digits, for example PLT.');
    }
    const cyclesEnabled = atomicProps.triStateValue(propsValue.cycles_enabled);
    const triageEnabled = atomicProps.triStateValue(propsValue.triage_enabled);
    const input = {
      ...linearGraphql.definedOnly({
        name: propsValue.name,
        key: key?.toUpperCase(),
        description: propsValue.description,
        icon: propsValue.icon,
        color: propsValue.color,
        timezone: propsValue.timezone,
      }),
      ...(cyclesEnabled === undefined ? {} : { cyclesEnabled }),
      ...(triageEnabled === undefined ? {} : { triageEnabled }),
    };
    if (Object.keys(input).length === 0) {
      throw new Error('Nothing to update: pass at least one setting to change.');
    }
    const data = await linearGraphql.request<{
      teamUpdate: { success: boolean; team: LinearTeamNode | null };
    }>({ auth, query: TEAM_UPDATE_MUTATION, variables: { id: propsValue.team_id.trim(), input } });
    const payload = linearGraphql.requireSuccess({ payload: data.teamUpdate, what: 'team update' });
    if (!payload.team) {
      throw new Error('Linear did not return the updated team.');
    }
    return atomicMappers.flattenTeam(payload.team);
  },
});
