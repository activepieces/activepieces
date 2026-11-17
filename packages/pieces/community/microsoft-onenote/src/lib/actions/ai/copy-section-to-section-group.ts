import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOnenoteOperationOutputSchema } from '../../output-schemas';

import type { OnenoteOperation } from '../../common/types';

export const copySectionToSectionGroupAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_copy_section_to_section_group',
  outputSchema: microsoftOnenoteOperationOutputSchema,
  displayName: 'Copy Section to Section Group',
  description: 'Starts copying a OneNote section to a section group.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Starts copying a section (ID from List Sections) into a section group (ID from List Section Groups). Returns the copy operation; poll Get Operation with its id until it succeeds to get the new section.',
    idempotent: false,
  },
  props: {
    sectionId: microsoftOneNoteAiProps.sectionId({ required: true }),
    destinationId: microsoftOneNoteAiProps.sectionGroupId({
      required: true,
      displayName: 'Destination Section Group ID',
      description: 'Section group to copy the section into. Use List Section Groups to find it.',
    }),
    renameAs: Property.ShortText({
      displayName: 'New Name',
      description: 'Name of the copy. Defaults to the original name.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response: OnenoteOperation = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote/sections/${encodeURIComponent(propsValue.sectionId)}/copyToSectionGroup`)
      .post({
        id: propsValue.destinationId,
        ...(propsValue.renameAs ? { renameAs: propsValue.renameAs } : {}),
      });
    return response;
  },
});
