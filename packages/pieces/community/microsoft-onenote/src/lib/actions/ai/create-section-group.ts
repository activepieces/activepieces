import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteCreateSectionGroupOutputSchema } from '../../output-schemas';

import type { SectionGroup } from '../../common/types';

export const createSectionGroupAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_create_section_group',
  outputSchema: microsoftOnenoteCreateSectionGroupOutputSchema,
  displayName: 'Create Section Group',
  description: 'Creates a OneNote section group.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a section group in a notebook (Notebook ID from List Notebooks) or nested in another section group (Parent Section Group ID from List Section Groups) and returns it with its ID. Set exactly one of the two.',
    idempotent: false,
  },
  props: {
    displayName: Property.ShortText({
      displayName: 'Name',
      description:
        "Section group name, unique in its parent, at most 50 characters, without ?*/:<>|&#'%~ characters.",
      required: true,
    }),
    notebookId: microsoftOneNoteAiProps.notebookId({ required: false }),
    parentSectionGroupId: microsoftOneNoteAiProps.sectionGroupId({
      required: false,
      displayName: 'Parent Section Group ID',
      description:
        'Creates the new group inside this section group. Use List Section Groups to find it.',
    }),
  },
  async run({ auth, propsValue }) {
    const { notebookId, parentSectionGroupId } = propsValue;
    if (Boolean(notebookId) === Boolean(parentSectionGroupId)) {
      throw new Error('Set exactly one of Notebook ID or Parent Section Group ID.');
    }
    const parent = notebookId
      ? `/notebooks/${encodeURIComponent(notebookId)}`
      : `/sectionGroups/${encodeURIComponent(parentSectionGroupId ?? '')}`;
    const response: SectionGroup = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote${parent}/sectionGroups`)
      .post({ displayName: propsValue.displayName });
    return response;
  },
});
