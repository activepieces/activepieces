import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostSearchFilesOutputSchema } from '../../../output-schemas';

export const searchFilesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_search_files',
  outputSchema: mattermostSearchFilesOutputSchema,
  displayName: 'Search Files',
  description: 'Searches files by name, extension or content.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches files posted in one team, or in all of the connected user\'s teams when Team ID is empty, by name, extension and (when content extraction is on) content. Terms accept "from:username", "in:channel-name" and "ext:pdf". Returns file IDs for Download File and Get File Info.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({
      required: false,
      description: 'Team ID (26 characters) to search in. Leave empty to search all of the connected user\'s teams. Use List Teams or Get Team By Name to find it.',
    }),
    terms: Property.ShortText({
      displayName: 'Terms',
      description: 'Search terms, e.g. "report ext:pdf from:alice in:town-square".',
      required: true,
    }),
    isOrSearch: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Match Any Term',
      description: '"true" to match files with any of the terms instead of all of them. Defaults to "false".',
    }),
    includeDeletedChannels: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Include Archived Channels',
      description: '"true" to also search files in archived channels. Defaults to "false".',
    }),
  },
  async run(context) {
    const { teamId, terms, isOrSearch, includeDeletedChannels } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: teamId ? `/teams/${encodeURIComponent(teamId)}/files/search` : '/files/search',
      body: {
        terms,
        is_or_search: mattermostUtils.parseBoolean({ value: isOrSearch }) ?? false,
        include_deleted_channels: mattermostUtils.parseBoolean({ value: includeDeletedChannels }),
      },
    });
  },
});
