import { createAction } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOneNoteUtils } from '../../common/utils';
import { microsoftOnenoteListSectionsOutputSchema } from '../../output-schemas';

import type { MicrosoftOneNoteList, OnenoteSection } from '../../common/types';

export const listSectionsAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_list_sections',
  outputSchema: microsoftOnenoteListSectionsOutputSchema,
  displayName: 'List Sections',
  description: 'Lists OneNote sections.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists OneNote sections with their IDs, names and links, one page at a time. Set Notebook ID (from List Notebooks) for one notebook's top-level sections, or Section Group ID (from List Section Groups) for one group's; leave both empty for every section. Set at most one of them.",
    idempotent: true,
  },
  props: {
    notebookId: microsoftOneNoteAiProps.notebookId({ required: false }),
    sectionGroupId: microsoftOneNoteAiProps.sectionGroupId({ required: false }),
    limit: microsoftOneNoteAiProps.limit({ required: false }),
    skip: microsoftOneNoteAiProps.skip({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { notebookId, sectionGroupId } = propsValue;
    if (notebookId && sectionGroupId) {
      throw new Error('Set at most one of Notebook ID or Section Group ID.');
    }
    const parent = notebookId
      ? `/notebooks/${encodeURIComponent(notebookId)}`
      : sectionGroupId
      ? `/sectionGroups/${encodeURIComponent(sectionGroupId)}`
      : '';
    const top = microsoftOneNoteUtils.pageSize({ limit: propsValue.limit });
    const skip = microsoftOneNoteUtils.offset({ skip: propsValue.skip });
    const request = microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote${parent}/sections`)
      .top(top);
    const response: MicrosoftOneNoteList<OnenoteSection> = await (skip === undefined
      ? request
      : request.skip(skip)
    ).get();
    return response;
  },
});
