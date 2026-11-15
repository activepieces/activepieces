import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfUtils } from '../common/utils';
import { searchSpacesOutputSchema } from '../output-schemas';

export const searchSpaces = createAction({
  auth: huggingFaceAuth,
  name: 'search_spaces',
  classification: 'SEARCH',
  displayName: 'Search Spaces',
  description: 'Search and filter Spaces (hosted ML apps) on the Hugging Face Hub.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Searches Hugging Face Spaces (hosted Gradio, Docker or static ML apps) by free text, author and tag filters, returning one page of Space summaries plus a next_cursor. Use Get Space for one Space's SDK, hardware and runtime stage; use Search Models or Search Datasets for other repo types. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: searchSpacesOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: "Free-text match on the Space ID, for example 'whisper' or 'chatbot'.",
      required: false,
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: "Only Spaces owned by this user or organization, for example 'huggingface'.",
      required: false,
    }),
    filter: Property.Array({
      displayName: 'Tag Filters',
      description: "Hub tags every result must carry, for example 'gradio', 'docker' or 'region:us'.",
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort order (always descending). Defaults to trending.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Trending', value: 'trendingScore' },
          { label: 'Likes', value: 'likes' },
          { label: 'Recently Created', value: 'createdAt' },
          { label: 'Recently Updated', value: 'lastModified' },
        ],
      },
    }),
    limit: hfProps.limit({ defaultValue: 20, max: 1000 }),
    full: Property.Checkbox({
      displayName: 'Include Full Details',
      description: 'Return extra fields such as the card data and file list for each Space.',
      required: false,
      defaultValue: false,
    }),
    cursor: hfProps.cursor(),
  },
  async run(context) {
    const { search, author, filter, sort, limit, full, cursor } = context.propsValue;
    hfUtils.assertLimit({ value: limit, min: 1, max: 1000, name: 'Limit' });
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/spaces',
      query: [
        ['search', search],
        ['author', author],
        ...hfUtils.toStringArray(filter).map((tag): [string, string] => ['filter', tag]),
        ['sort', sort],
        ['limit', limit],
        ['full', full ? 'true' : undefined],
        ['cursor', cursor],
      ],
    });
    const spaces = Array.isArray(response.body) ? response.body : [];
    return {
      spaces,
      count: spaces.length,
      next_cursor: hfHub.parseNextCursor(response.headers),
    };
  },
});
