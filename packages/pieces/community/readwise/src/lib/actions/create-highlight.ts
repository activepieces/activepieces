import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { readwiseAuth } from '../common/auth';
import { makeReadwiseRequest, ReadwiseCreatedSource } from '../common/client';

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
    source_type: Property.ShortText({
      displayName: 'Source Type',
      description:
        'An identifier for your app/source, e.g. "my_app" (3–64 chars, no spaces).',
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
        ],
      },
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional note to attach to the highlight.',
      required: false,
    }),
    location: Property.Number({
      displayName: 'Location',
      description: 'Position of the highlight in the source.',
      required: false,
    }),
    location_type: Property.StaticDropdown({
      displayName: 'Location Type',
      description: 'How the location above is measured.',
      required: false,
      options: {
        options: [
          { label: 'Page', value: 'page' },
          { label: 'Location', value: 'location' },
          { label: 'Order', value: 'order' },
          { label: 'Offset', value: 'offset' },
          { label: 'Time Offset', value: 'time_offset' },
          { label: 'None', value: 'none' },
        ],
      },
    }),
    image_url: Property.ShortText({
      displayName: 'Image URL',
      description: 'Cover image for the source.',
      required: false,
    }),
    highlight_url: Property.ShortText({
      displayName: 'Highlight URL',
      description: 'A unique URL that links directly to this highlight.',
      required: false,
    }),
    highlighted_at: Property.DateTime({
      displayName: 'Highlighted At',
      description: 'Date when the highlight was made (defaults to now).',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const highlight: Record<string, unknown> = { text: p.text };
    if (p.title) highlight['title'] = p.title;
    if (p.author) highlight['author'] = p.author;
    if (p.source_url) highlight['source_url'] = p.source_url;
    if (p.source_type) highlight['source_type'] = p.source_type;
    if (p.category) highlight['category'] = p.category;
    if (p.note) highlight['note'] = p.note;
    if (p.location !== undefined && p.location !== null) {
      highlight['location'] = p.location;
    }
    if (p.location_type) highlight['location_type'] = p.location_type;
    if (p.image_url) highlight['image_url'] = p.image_url;
    if (p.highlight_url) highlight['highlight_url'] = p.highlight_url;
    if (p.highlighted_at) {
      highlight['highlighted_at'] = new Date(p.highlighted_at).toISOString();
    }
    return makeReadwiseRequest<ReadwiseCreatedSource[]>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      endpoint: '/highlights/',
      body: { highlights: [highlight] },
    });
  },
});
