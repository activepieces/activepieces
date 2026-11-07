import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftOneNoteAuth } from '../../auth';
import { microsoftOneNoteAiProps } from '../../common/ai-props';
import { microsoftOneNoteClient } from '../../common/client';
import { microsoftOneNoteUtils } from '../../common/utils';
import { microsoftOnenoteListPagesOutputSchema } from '../../output-schemas';

import type { MicrosoftOneNoteList, OnenotePage } from '../../common/types';

const ORDER_BY_OPTIONS = [
  'lastModifiedDateTime desc',
  'lastModifiedDateTime asc',
  'createdDateTime desc',
  'createdDateTime asc',
  'title asc',
  'title desc',
];

export const listPagesAction = createAction({
  auth: microsoftOneNoteAuth,
  name: 'microsoft_onenote_list_pages',
  outputSchema: microsoftOnenoteListPagesOutputSchema,
  displayName: 'List Pages',
  description: 'Lists OneNote pages.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists OneNote pages with their IDs, titles, dates and links, one page of results at a time (at most 100). Set Section ID (from List Sections) for one section's pages, otherwise lists pages across all sections. Title Contains filters by title, case-insensitively. Use Get Page Content for a page's body.",
    idempotent: true,
  },
  props: {
    sectionId: microsoftOneNoteAiProps.sectionId({ required: false }),
    titleContains: Property.ShortText({
      displayName: 'Title Contains',
      description: 'Only pages whose title contains this text, ignoring case.',
      required: false,
    }),
    orderBy: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Sort order. Defaults to last modified, newest first.',
      required: false,
      options: {
        disabled: false,
        options: ORDER_BY_OPTIONS.map((value) => ({ label: value, value })),
      },
    }),
    limit: microsoftOneNoteAiProps.limit({ required: false }),
    skip: microsoftOneNoteAiProps.skip({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { sectionId, titleContains, orderBy } = propsValue;
    if (orderBy && !ORDER_BY_OPTIONS.includes(orderBy)) {
      throw new Error(`Order By must be one of: ${ORDER_BY_OPTIONS.join(', ')}.`);
    }
    const parent = sectionId ? `/sections/${encodeURIComponent(sectionId)}` : '';
    const top = microsoftOneNoteUtils.pageSize({ limit: propsValue.limit });
    const skip = microsoftOneNoteUtils.offset({ skip: propsValue.skip });
    const query: Record<string, string> = {
      $top: String(top),
      ...(skip !== undefined ? { $skip: String(skip) } : {}),
      ...(titleContains
        ? {
            $filter: `contains(tolower(title),'${titleContains
              .toLowerCase()
              .replace(/'/g, "''")}')`,
          }
        : {}),
      ...(orderBy ? { $orderby: orderBy } : {}),
    };
    const response: MicrosoftOneNoteList<OnenotePage> = await microsoftOneNoteClient
      .create({ auth })
      .api(`/me/onenote${parent}/pages`)
      .query(query)
      .get();
    return response;
  },
});
