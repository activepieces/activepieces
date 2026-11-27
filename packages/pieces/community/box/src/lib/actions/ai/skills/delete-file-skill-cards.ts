import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const deleteFileSkillCardsAction = createAction({
  auth: boxAuth,
  name: 'box_delete_file_skill_cards',
  displayName: 'Delete File Skill Cards',
  description: 'Removes all Box Skills cards from a Box file.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes every Box Skills card on a file for good; to change one card use Update File Skill Cards. Fails with 404 when the file has no cards. Get the file ID from List Folder Items or Search.',
    idempotent: false,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/metadata/global/boxSkillsCards`,
    });
    return { deleted: true, fileId: propsValue.fileId };
  },
});
