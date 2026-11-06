import { createAction } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteGetSectionGroupOutputSchema } from '../../output-schemas';

import type { SectionGroup } from '../../common/types';

export const getSectionGroupAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_get_section_group',
  outputSchema: microsoftOnenoteGetSectionGroupOutputSchema,
  displayName: 'Get Section Group',
  description: 'Gets a OneNote section group by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one OneNote section group (ID from List Section Groups) with its name, parent notebook and parent section group.',
    idempotent: true,
  },
  props: {
    sectionGroupId: microsoftOneNoteAiProps.sectionGroupId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response: SectionGroup = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote/sectionGroups/${encodeURIComponent(propsValue.sectionGroupId)}`)
      .expand(['parentNotebook', 'parentSectionGroup'])
      .get();
    return response;
  },
});
