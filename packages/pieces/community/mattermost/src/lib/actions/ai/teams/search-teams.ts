import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostSearchTeamsOutputSchema } from '../../../output-schemas';

export const searchTeamsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_search_teams',
  outputSchema: mattermostSearchTeamsOutputSchema,
  displayName: 'Search Teams',
  description: 'Searches teams by name or display name.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Finds teams whose handle or display name matches the term, one page at a time, with the total match count. Regular users only find open teams; a system admin connection finds all of them.',
    idempotent: true,
  },
  props: {
    term: Property.ShortText({
      displayName: 'Term',
      description: 'Text to match against team handles and display names.',
      required: true,
    }),
    allowOpenInvite: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Allow Open Invite',
      description: '"true" for only teams anyone can join, "false" for only teams that need an invite. Leave empty for both.',
    }),
    page: mattermostAiProps.page({ required: false }),
    perPage: mattermostAiProps.perPage({ required: false }),
  },
  async run(context) {
    const { term, allowOpenInvite, page, perPage } = context.propsValue;
    const paging = mattermostUtils.paging({ page, perPage });
    const openInvite = mattermostUtils.parseBoolean({ value: allowOpenInvite });
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/teams/search',
      body: {
        term,
        page: Number(paging.page),
        per_page: Number(paging.per_page),
        ...(openInvite !== undefined ? { allow_open_invite: openInvite } : {}),
      },
    });
  },
});
