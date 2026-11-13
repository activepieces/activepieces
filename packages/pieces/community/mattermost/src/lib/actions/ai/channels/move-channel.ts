import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostCreateChannelOutputSchema } from '../../../output-schemas';

export const moveChannelAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_move_channel',
  outputSchema: mattermostCreateChannelOutputSchema,
  displayName: 'Move Channel',
  description: 'Moves a channel to another team.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Moves a public or private channel, with its messages, to another team. Fails if some members are not in the target team unless Force is "true", which removes them from the channel. Needs the manage_system permission.',
    idempotent: false,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
    teamId: mattermostAiProps.teamId({
      required: true,
      displayName: 'Target Team ID',
      description: 'ID (26 characters) of the team to move the channel to. Use List Teams or Get Team By Name to find it.',
    }),
    force: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Force',
      description: '"true" to remove channel members who are not in the target team and move anyway. Defaults to "false".',
    }),
  },
  async run(context) {
    const { channelId, teamId, force } = context.propsValue;
    const forceMove = mattermostUtils.parseBoolean({ value: force });
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/channels/${encodeURIComponent(channelId)}/move`,
      body: { team_id: teamId, ...(forceMove !== undefined ? { force: forceMove } : {}) },
    });
  },
});
