import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfUtils } from '../common/utils';
import { searchDatasetsOutputSchema } from '../output-schemas';

export const searchDatasets = createAction({
  auth: huggingFaceAuth,
  name: 'search_datasets',
  classification: 'SEARCH',
  displayName: 'Search Datasets',
  description: 'Search and filter datasets on the Hugging Face Hub.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Searches Hugging Face Hub datasets by free text, author, tag filters and gating, returning one page of dataset summaries plus a next_cursor. Task filtering goes through Tag Filters (for example 'task_categories:text-classification'), not a pipeline field. Use Get Dataset for one dataset's metadata and Search Models or Search Spaces for other repo types. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: searchDatasetsOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: "Free-text match on the dataset ID, for example 'imdb' or 'squad'.",
      required: false,
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: "Only datasets owned by this user or organization, for example 'stanfordnlp'.",
      required: false,
    }),
    filter: Property.Array({
      displayName: 'Tag Filters',
      description:
        "Hub tags every result must carry, for example 'task_categories:text-classification', 'language:en' or 'size_categories:10K<n<100K'. Discover valid values with List Hub Tags by Type.",
      required: false,
    }),
    gated: Property.StaticDropdown({
      displayName: 'Gated',
      description: 'Only gated datasets, only non-gated datasets, or leave empty for both.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Only gated', value: 'true' },
          { label: 'Only not gated', value: 'false' },
        ],
      },
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort order (always descending). Defaults to trending.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Trending', value: 'trendingScore' },
          { label: 'Downloads', value: 'downloads' },
          { label: 'Likes', value: 'likes' },
          { label: 'Recently Created', value: 'createdAt' },
          { label: 'Recently Updated', value: 'lastModified' },
        ],
      },
    }),
    limit: hfProps.limit({ defaultValue: 20, max: 1000 }),
    full: Property.Checkbox({
      displayName: 'Include Full Details',
      description: 'Return extra fields such as the card data and file list for each dataset.',
      required: false,
      defaultValue: false,
    }),
    cursor: hfProps.cursor(),
  },
  async run(context) {
    const { search, author, filter, gated, sort, limit, full, cursor } = context.propsValue;
    hfUtils.assertLimit({ value: limit, min: 1, max: 1000, name: 'Limit' });
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/datasets',
      query: [
        ['search', search],
        ['author', author],
        ...hfUtils.toStringArray(filter).map((tag): [string, string] => ['filter', tag]),
        ['gated', hfUtils.booleanFlag(gated)],
        ['sort', sort],
        ['limit', limit],
        ['full', full ? 'true' : undefined],
        ['cursor', cursor],
      ],
    });
    const datasets = Array.isArray(response.body) ? response.body : [];
    return {
      datasets,
      count: datasets.length,
      next_cursor: hfHub.parseNextCursor(response.headers),
    };
  },
});
