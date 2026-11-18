import { createAction } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOneNoteUtils } from '../../common/utils';
import { microsoftOnenoteListSectionGroupsOutputSchema } from '../../output-schemas';

import type { MicrosoftOneNoteList, SectionGroup } from '../../common/types';

export const listSectionGroupsAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_list_section_groups',
  outputSchema: microsoftOnenoteListSectionGroupsOutputSchema,
  displayName: 'List Section Groups',
  description: 'Lists OneNote section groups.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists OneNote section groups with their IDs, names and parents, one page at a time. Set Notebook ID (from List Notebooks) for one notebook's top-level groups, or Parent Section Group ID for the groups nested in a group; leave both empty for every section group. Set at most one of them.",
    idempotent: true,
  },
  props: {
    notebookId: microsoftOneNoteAiProps.notebookId({ required: false }),
    parentSectionGroupId: microsoftOneNoteAiProps.sectionGroupId({
      required: false,
      displayName: 'Parent Section Group ID',
      description:
        'Lists the section groups nested in this section group. Use List Section Groups to find it.',
    }),
    limit: microsoftOneNoteAiProps.limit({ required: false }),
    skip: microsoftOneNoteAiProps.skip({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { notebookId, parentSectionGroupId } = propsValue;
    if (notebookId && parentSectionGroupId) {
      throw new Error('Set at most one of Notebook ID or Parent Section Group ID.');
    }
    const parent = notebookId
      ? `/notebooks/${encodeURIComponent(notebookId)}`
      : parentSectionGroupId
      ? `/sectionGroups/${encodeURIComponent(parentSectionGroupId)}`
      : '';
    const top = microsoftOneNoteUtils.pageSize({ limit: propsValue.limit });
    const skip = microsoftOneNoteUtils.offset({ skip: propsValue.skip });
    const request = microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote${parent}/sectionGroups`)
      .top(top);
    const response: MicrosoftOneNoteList<SectionGroup> = await (skip === undefined
      ? request
      : request.skip(skip)
    ).get();
    return response;
  },
});
