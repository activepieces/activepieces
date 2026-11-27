import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const createFileSkillCardsAction = createAction({
  auth: boxAuth,
  name: 'box_create_file_skill_cards',
  displayName: 'Create File Skill Cards',
  description: 'Adds Box Skills cards to a Box file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Stores a list of Box Skills cards (keyword, transcript, timeline or status) on a file that has none. Fails with 409 if the file already has cards: use Update File Skill Cards, or Delete File Skill Cards first. Get the file ID from List Folder Items or Search.',
    idempotent: false,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    cards: Property.Json({
      displayName: 'Cards',
      description:
        'The cards as {"cards": [...]}, e.g. {"cards": [{"type": "skill_card", "skill_card_type": "keyword", "skill_card_title": {"message": "Topics"}, "skill": {"type": "service", "id": "my-skill"}, "invocation": {"type": "skill_invocation", "id": "my-run-1"}, "entries": [{"text": "contract"}]}]}.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.POST,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/metadata/global/boxSkillsCards`,
      body: propsValue.cards,
    });
  },
});
