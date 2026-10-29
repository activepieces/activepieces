import { createAction } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOneNoteUtils } from '../../common/utils';
import { microsoftOnenoteListNotebooksOutputSchema } from '../../output-schemas';

import type { MicrosoftOneNoteList, Notebook } from '../../common/types';

export const listNotebooksAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_list_notebooks',
  outputSchema: microsoftOnenoteListNotebooksOutputSchema,
  displayName: 'List Notebooks',
  description: 'Lists OneNote notebooks.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists your own OneNote notebooks with their IDs, names and links, one page at a time. Use Get Recent Notebooks for notebooks you opened recently, including shared ones.',
    idempotent: true,
  },
  props: {
    limit: microsoftOneNoteAiProps.limit({ required: false }),
    skip: microsoftOneNoteAiProps.skip({ required: false }),
  },
  async run({ auth, propsValue }) {
    const top = microsoftOneNoteUtils.pageSize({ limit: propsValue.limit });
    const skip = microsoftOneNoteUtils.offset({ skip: propsValue.skip });
    const request = microsoftOneNoteClient.create({ auth }).api(`/me/onenote/notebooks`).top(top);
    const response: MicrosoftOneNoteList<Notebook> = await (skip === undefined
      ? request
      : request.skip(skip)
    ).get();
    return response;
  },
});
