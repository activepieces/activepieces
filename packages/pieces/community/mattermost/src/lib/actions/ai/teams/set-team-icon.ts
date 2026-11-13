import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const setTeamIconAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_set_team_icon',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Set Team Icon',
  description: 'Uploads an image as a team\'s icon.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the team\'s icon with the uploaded image. Needs the manage_team permission. Remove Team Icon restores the default.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    image: Property.File({
      displayName: 'Image',
      description: 'Image file for the icon.',
      required: true,
    }),
  },
  async run(context) {
    const { teamId, image } = context.propsValue;
    const form = new FormData();
    form.append('image', new Blob([new Uint8Array(image.data)]), image.filename);
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/teams/${encodeURIComponent(teamId)}/image`,
      body: form,
    });
  },
});
