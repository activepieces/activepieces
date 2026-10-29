import { createAction } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteGetSectionOutputSchema } from '../../output-schemas';

import type { OnenoteSection } from '../../common/types';

export const getSectionAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_get_section',
  outputSchema: microsoftOnenoteGetSectionOutputSchema,
  displayName: 'Get Section',
  description: 'Gets a OneNote section by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one OneNote section (ID from List Sections) with its name, links, parent notebook and parent section group.',
    idempotent: true,
  },
  props: {
    sectionId: microsoftOneNoteAiProps.sectionId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response: OnenoteSection = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote/sections/${encodeURIComponent(propsValue.sectionId)}`)
      .expand(['parentNotebook', 'parentSectionGroup'])
      .get();
    return response;
  },
});
