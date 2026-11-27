import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const updateFileSkillCardsAction = createAction({
  auth: boxAuth,
  name: 'box_update_file_skill_cards',
  displayName: 'Update File Skill Cards',
  description: 'Replaces one Box Skills card on a Box file.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces the card at one position in a file\'s Box Skills cards with a new card; the other cards stay. Get the position (0-based) from List File Skill Cards; use Create File Skill Cards when the file has none.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    cardIndex: Property.Number({
      displayName: 'Card Index',
      description: 'Zero-based position of the card to replace, in the order List File Skill Cards returns them.',
      required: true,
    }),
    card: Property.Json({
      displayName: 'Card',
      description:
        'The full replacement card, e.g. {"type": "skill_card", "skill_card_type": "keyword", "skill_card_title": {"message": "Topics"}, "skill": {"type": "service", "id": "my-skill"}, "invocation": {"type": "skill_invocation", "id": "my-run-1"}, "entries": [{"text": "contract"}]}.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await boxClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/metadata/global/boxSkillsCards`,
      headers: { 'content-type': 'application/json-patch+json' },
      body: [{ op: 'replace', path: `/cards/${propsValue.cardIndex}`, value: propsValue.card }],
    });
  },
});
