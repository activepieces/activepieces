import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostDownloadFileOutputSchema } from '../../../output-schemas';

export const getTeamIconAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_team_icon',
  outputSchema: mattermostDownloadFileOutputSchema,
  displayName: 'Get Team Icon',
  description: 'Downloads a team\'s icon image.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads the team\'s icon and returns it as a file. Fails if the team has no custom icon; set one with Set Team Icon.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
  },
  async run(context) {
    const download = await mattermostClient.download({
      auth: context.auth,
      path: `/teams/${encodeURIComponent(context.propsValue.teamId)}/image`,
    });
    const fileName = download.fileName ?? 'team-icon.png';
    const file = await context.files.write({ fileName, data: download.data });
    return { file, fileName, contentType: download.contentType, size: download.data.length };
  },
});
