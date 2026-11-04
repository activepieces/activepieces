import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostAddTeamMembersOutputSchema } from '../../../output-schemas';

export const listTeamMembersAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_team_members',
  outputSchema: mattermostAddTeamMembersOutputSchema,
  displayName: 'List Team Members',
  description: 'Lists the members of a team, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns one page of team memberships (user ID, roles, admin flag). For specific users use Get Team Member or Get Team Members By IDs; for the member count use Get Team Stats.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: '"Username" to sort by username. Leave empty to sort by user ID.',
      required: false,
      options: {
        disabled: false,
        options: [{ label: 'Username', value: 'Username' }],
      },
    }),
    excludeDeletedUsers: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Exclude Deleted Users',
      description: '"true" to leave out deactivated users. Defaults to "false".',
    }),
    page: mattermostAiProps.page({ required: false }),
    perPage: mattermostAiProps.perPage({ required: false }),
  },
  async run(context) {
    const { teamId, sort, excludeDeletedUsers, page, perPage } = context.propsValue;
    if (sort !== undefined && sort !== 'Username') {
      throw new Error(`Sort must be "Username" or empty, got "${sort}".`);
    }
    const excludeDeleted = mattermostUtils.parseBoolean({ value: excludeDeletedUsers });
    const members = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/teams/${encodeURIComponent(teamId)}/members`,
      query: {
        ...mattermostUtils.paging({ page, perPage }),
        ...(sort !== undefined ? { sort } : {}),
        ...(excludeDeleted !== undefined ? { exclude_deleted_users: String(excludeDeleted) } : {}),
      },
    });
    return { members, count: members.length };
  },
});
