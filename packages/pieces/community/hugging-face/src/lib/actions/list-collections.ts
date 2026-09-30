import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfUtils } from '../common/utils';
import { listCollectionsOutputSchema } from '../output-schemas';

export const listCollections = createAction({
  auth: huggingFaceAuth,
  name: 'list_collections',
  classification: 'SEARCH',
  displayName: 'List Collections',
  description: 'List or search curated collections on the Hugging Face Hub.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists Hugging Face collections (curated groups of models, datasets, Spaces and papers), filterable by owner, contained item and text, one page per call with a next_cursor. Each entry carries its slug ('namespace/title-id'), which Get Collection needs to return every item. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: listCollectionsOutputSchema,
  props: {
    owner: Property.ShortText({
      displayName: 'Owner',
      description: "Only collections owned by this user or organization, for example 'huggingface'.",
      required: false,
    }),
    item: Property.ShortText({
      displayName: 'Contains Item',
      description:
        "Only collections that contain this item, written as '<type>/<id>', for example 'models/openai-community/gpt2', 'datasets/stanfordnlp/imdb' or 'papers/2307.09288'.",
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only collections whose title matches this text.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort order. Defaults to trending.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Trending', value: 'trending' },
          { label: 'Upvotes', value: 'upvotes' },
          { label: 'Recently Updated', value: 'lastModified' },
        ],
      },
    }),
    limit: hfProps.limit({ defaultValue: 10, max: 100 }),
    cursor: hfProps.cursor(),
  },
  async run(context) {
    const { owner, item, search, sort, limit, cursor } = context.propsValue;
    hfUtils.assertLimit({ value: limit, min: 1, max: 100, name: 'Limit' });
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/collections',
      query: [
        ['owner', owner],
        ['item', item],
        ['q', search],
        ['sort', sort],
        ['limit', limit],
        ['cursor', cursor],
      ],
    });
    const collections = Array.isArray(response.body) ? response.body : [];
    return {
      collections,
      count: collections.length,
      next_cursor: hfHub.parseNextCursor(response.headers),
    };
  },
});
