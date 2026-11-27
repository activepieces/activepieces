import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxCreateFileSkillCardsOutputSchema } from '../../../output-schemas';

export const listFileSkillCardsAction = createAction({
  auth: boxAuth,
  name: 'box_list_file_skill_cards',
  outputSchema: boxCreateFileSkillCardsOutputSchema,
  displayName: 'List File Skill Cards',
  description: 'Lists the Box Skills cards on a Box file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the Box Skills cards (keywords, transcripts, timelines, status) stored on a file, in order; a card\'s position is the index Update File Skill Cards takes. Fails with 404 when the file has no cards. Get the file ID from List Folder Items or Search.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.GET,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/metadata/global/boxSkillsCards`,
    });
  },
});
