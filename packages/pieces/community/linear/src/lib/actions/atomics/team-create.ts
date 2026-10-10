import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { atomicMappers, atomicProps, LinearTeamNode } from './common';
import { TEAM_CREATE_MUTATION } from './queries';
import { atomicTeamOutputSchema } from './output-schemas';

export const linearTeamCreateAtomic = createAction({
  auth: linearAuth,
  name: 'linear_team_create',
  classification: 'WRITE',
  displayName: 'Create Team (AI)',
  description: 'Create a new team with a name and, optionally, its key, description, icon, color, timezone, cycles and triage.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Linear team, which gets its own issue key, workflow statuses and settings. Only create a team when asked: check List Teams first, since a team with the same name or key may already exist. The key (1 to 7 letters or digits) prefixes every issue identifier of the team; Linear derives one from the name when it is left empty. May need an admin key, and the Free plan allows only 2 teams. Not idempotent: each call adds a team.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Team name, for example "Platform".', required: true }),
    key: Property.ShortText({ displayName: 'Key', description: 'Issue key, for example PLT. Leave empty to let Linear derive one from the name.', required: false }),
    description: Property.ShortText({ displayName: 'Description', required: false }),
    icon: Property.ShortText({ displayName: 'Icon', required: false }),
    color: Property.ShortText({ displayName: 'Color', description: 'Hex color, for example #5E6AD2.', required: false }),
    timezone: Property.ShortText({ displayName: 'Timezone', description: 'IANA timezone, for example Europe/Berlin.', required: false }),
    cycles_enabled: atomicProps.triStateProp({ displayName: 'Cycles', description: 'Turn cycles on or off. Leave empty for the Linear default.' }),
    triage_enabled: atomicProps.triStateProp({ displayName: 'Triage', description: 'Turn triage on or off. Leave empty for the Linear default.' }),
  },
  outputSchema: atomicTeamOutputSchema,
  async run({ auth, propsValue }) {
    const name = propsValue.name.trim();
    if (!name) {
      throw new Error('Name is required.');
    }
    const key = propsValue.key?.trim();
    if (key && !/^[A-Za-z0-9]{1,7}$/.test(key)) {
      throw new Error('Key must be 1 to 7 letters or digits, for example PLT.');
    }
    const cyclesEnabled = atomicProps.triStateValue(propsValue.cycles_enabled);
    const triageEnabled = atomicProps.triStateValue(propsValue.triage_enabled);
    const input = {
      ...linearGraphql.definedOnly({
        name,
        key: key?.toUpperCase(),
        description: propsValue.description,
        icon: propsValue.icon,
        color: propsValue.color,
        timezone: propsValue.timezone,
      }),
      ...(cyclesEnabled === undefined ? {} : { cyclesEnabled }),
      ...(triageEnabled === undefined ? {} : { triageEnabled }),
    };
    const data = await linearGraphql.request<{
      teamCreate: { success: boolean; team: LinearTeamNode | null };
    }>({ auth, query: TEAM_CREATE_MUTATION, variables: { input } });
    const payload = linearGraphql.requireSuccess({ payload: data.teamCreate, what: 'team creation' });
    if (!payload.team) {
      throw new Error('Linear did not return the new team.');
    }
    return atomicMappers.flattenTeam(payload.team);
  },
});
