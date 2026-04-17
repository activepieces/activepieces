import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { readwiseAuth } from '../../index';
import { makeReadwiseRequest } from '../common/client';

export const createHighlight = createAction({
  name: 'create_highlight',
  displayName: 'Create Highlight',
  description: 'Save a new highlight to Readwise.',
  auth: readwiseAuth,
  props: {
    text: Property.LongText({
      displayName: 'Highlight Text',
      description: 'The text you want to save as a highlight.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Source Title',
      description: 'Title of the book, article, or source.',
      required: false,
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: 'Author of the source.',
      required: false,
    }),
    source_url: Property.ShortText({
      displayName: 'Source URL',
      description: 'URL of the article or webpage.',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional note to attach to the highlight.',
      required: false,
    }),
    highlighted_at: Property.DateTime({
      displayName: 'Highlighted At',
      description: 'Date when the highlight was made (defaults to now).',
      required: false,
    }),
    category: Property.StaticDropdown({
      displayName: 'Category',
      description: 'Type of source.',
      required: false,
      defaultValue: 'articles',
      options: {
        options: [
          { label: 'Articles', value: 'articles' },
          { label: 'Books', value: 'books' },
          { label: 'Tweets', value: 'tweets' },
          { label: 'Podcasts', value: 'podcasts' },
          { label: 'Supplementals', value: 'supplementals' },
        ],
      },
    }),
  },
  async run(context) {
    const token = context.auth.secret_text;
    const p = context.propsValue;
    const highlight: Record<string, unknown> = { text: p.text };
    if (p.title) highlight['title'] = p.title;
    if (p.author) highlight['author'] = p.author;
    if (p.source_url) highlight['source_url'] = p.source_url;
    if (p.note) highlight['note'] = p.note;
    if (p.category) highlight['category'] = p.category;
    if (p.highlighted_at) {
      highlight['highlighted_at'] = new Date(p.highlighted_at).toISOString();
    }
    return makeReadwiseRequest<{ highlights: unknown[] }>({
      token,
      method: HttpMethod.POST,
      endpoint: '/highlights/',
      body: { highlights: [highlight] },
    });
  },
});
