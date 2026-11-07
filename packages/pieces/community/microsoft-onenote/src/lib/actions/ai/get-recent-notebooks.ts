import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOneNoteUtils } from '../../common/utils';
import { microsoftOnenoteGetRecentNotebooksOutputSchema } from '../../output-schemas';

import type { MicrosoftOneNoteList, RecentNotebook } from '../../common/types';

export const getRecentNotebooksAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_get_recent_notebooks',
  outputSchema: microsoftOnenoteGetRecentNotebooksOutputSchema,
  displayName: 'Get Recent Notebooks',
  description: 'Lists the OneNote notebooks you opened recently.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists the notebooks you opened recently, including ones other people shared with you, with their names, last access time and web links. Use Get Notebook from Web URL to get a listed notebook's ID.",
    idempotent: true,
  },
  props: {
    includePersonalNotebooks: Property.StaticDropdown({
      displayName: 'Include Personal Notebooks',
      description: 'Whether to include notebooks from your personal Microsoft account.',
      required: true,
      defaultValue: 'true',
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const includePersonal = microsoftOneNoteUtils.booleanChoice({
      value: propsValue.includePersonalNotebooks,
      propName: 'Include Personal Notebooks',
    });
    const response: MicrosoftOneNoteList<RecentNotebook> = await microsoftOneNoteClient
      .create({ auth })
      .api(
        `/me/onenote/notebooks/getRecentNotebooks(includePersonalNotebooks=${String(
          includePersonal ?? true,
        )})`,
      )
      .get();
    return response;
  },
});
