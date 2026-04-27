import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoteroAuth } from '../../index';
import { makeZoteroRequest } from '../common/client';

export const createItem = createAction({
  name: 'create_item',
  displayName: 'Create Item',
  description: 'Add a new reference or item to your Zotero library.',
  auth: zoteroAuth,
  props: {
    item_type: Property.StaticDropdown({
      displayName: 'Item Type',
      required: true,
      defaultValue: 'webpage',
      options: {
        options: [
          { label: 'Webpage', value: 'webpage' },
          { label: 'Journal Article', value: 'journalArticle' },
          { label: 'Book', value: 'book' },
          { label: 'Book Section', value: 'bookSection' },
          { label: 'Conference Paper', value: 'conferencePaper' },
          { label: 'Report', value: 'report' },
          { label: 'Thesis', value: 'thesis' },
          { label: 'Blog Post', value: 'blogPost' },
          { label: 'Podcast', value: 'podcast' },
          { label: 'Video Recording', value: 'videoRecording' },
        ],
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    url: Property.ShortText({
      displayName: 'URL',
      required: false,
    }),
    abstract: Property.LongText({
      displayName: 'Abstract / Note',
      required: false,
    }),
    author_first: Property.ShortText({
      displayName: 'Author First Name',
      required: false,
    }),
    author_last: Property.ShortText({
      displayName: 'Author Last Name',
      required: false,
    }),
    date: Property.ShortText({
      displayName: 'Date (e.g. 2026-04-17)',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags (comma-separated)',
      required: false,
    }),
    collection_key: Property.ShortText({
      displayName: 'Collection Key',
      description: 'Add item to a specific collection.',
      required: false,
    }),
  },
  async run(context) {
    const { api_key, user_or_group, library_id } = context.auth.props;
    const p = context.propsValue;

    const item: Record<string, unknown> = {
      itemType: p.item_type,
      title: p.title,
      abstractNote: p.abstract ?? '',
      url: p.url ?? '',
      date: p.date ?? '',
      tags: p.tags ? p.tags.split(',').map((t: string) => ({ tag: t.trim() })) : [],
      collections: p.collection_key ? [p.collection_key] : [],
      creators:
        p.author_first || p.author_last
          ? [{ creatorType: 'author', firstName: p.author_first ?? '', lastName: p.author_last ?? '' }]
          : [],
    };

    const { body } = await makeZoteroRequest<unknown[]>({
      apiKey: api_key,
      userOrGroup: user_or_group,
      libraryId: library_id,
      method: HttpMethod.POST,
      endpoint: '/items',
      body: [item],
    });
    return body;
  },
});
