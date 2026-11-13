import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteCreateSectionOutputSchema } from '../../output-schemas';

import type { OnenoteSection } from '../../common/types';

export const createSectionAiAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_create_section',
  outputSchema: microsoftOnenoteCreateSectionOutputSchema,
  displayName: 'Create Section',
  description: 'Creates a OneNote section.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a section in a notebook (Notebook ID from List Notebooks) or in a section group (Section Group ID from List Section Groups) and returns it with its ID. Set exactly one of the two. Fails if the parent already has a section with that name.',
    idempotent: false,
  },
  props: {
    displayName: Property.ShortText({
      displayName: 'Name',
      description:
        "Section name, unique in its parent, at most 50 characters, without ?*/:<>|&#'%~ characters.",
      required: true,
    }),
    notebookId: microsoftOneNoteAiProps.notebookId({ required: false }),
    sectionGroupId: microsoftOneNoteAiProps.sectionGroupId({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { notebookId, sectionGroupId } = propsValue;
    if (Boolean(notebookId) === Boolean(sectionGroupId)) {
      throw new Error('Set exactly one of Notebook ID or Section Group ID.');
    }
    const parent = notebookId
      ? `/notebooks/${encodeURIComponent(notebookId)}`
      : `/sectionGroups/${encodeURIComponent(sectionGroupId ?? '')}`;
    const response: OnenoteSection = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote${parent}/sections`)
      .post({ displayName: propsValue.displayName });
    return response;
  },
});
