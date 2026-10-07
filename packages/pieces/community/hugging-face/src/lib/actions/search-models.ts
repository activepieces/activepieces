import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfUtils } from '../common/utils';
import { searchModelsOutputSchema } from '../output-schemas';

export const searchModels = createAction({
  auth: huggingFaceAuth,
  name: 'search_models',
  classification: 'SEARCH',
  displayName: 'Search Models',
  description: 'Search and filter models on the Hugging Face Hub.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Searches the Hugging Face Hub model catalogue by free text, author, tag filters, pipeline task and Inference Provider availability, returning one page of model summaries plus a next_cursor. Use it to find a model ID before calling Get Model, Generate Chat Completion (pipeline_tag 'text-generation', inference_provider 'all') or Generate Text Embeddings (pipeline_tag 'feature-extraction'); use Search Datasets or Search Spaces for other repo types. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: searchModelsOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: "Free-text match on the model ID, for example 'llama' or 'bert-base'.",
      required: false,
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: "Only models owned by this user or organization, for example 'meta-llama'.",
      required: false,
    }),
    filter: Property.Array({
      displayName: 'Tag Filters',
      description:
        "Hub tags every result must carry, for example 'text-classification', 'pytorch', 'license:apache-2.0' or 'language:en'. Discover valid values with List Hub Tags by Type.",
      required: false,
    }),
    pipeline_tag: Property.ShortText({
      displayName: 'Pipeline Task',
      description: "Only models for this task, for example 'text-generation', 'feature-extraction' or 'image-classification'.",
      required: false,
    }),
    inference_provider: Property.ShortText({
      displayName: 'Inference Provider',
      description:
        "Only models served by Inference Providers: 'all' for any provider, or one provider name such as 'groq', 'together' or 'hf-inference'.",
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
      description: 'Return extra fields such as the file list and last-modified date for each model.',
      required: false,
      defaultValue: false,
    }),
    cursor: hfProps.cursor(),
  },
  async run(context) {
    const { search, author, filter, pipeline_tag, inference_provider, sort, limit, full, cursor } =
      context.propsValue;
    hfUtils.assertLimit({ value: limit, min: 1, max: 1000, name: 'Limit' });
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/models',
      query: [
        ['search', search],
        ['author', author],
        ...hfUtils.toStringArray(filter).map((tag): [string, string] => ['filter', tag]),
        ['pipeline_tag', pipeline_tag],
        ['inference_provider', inference_provider],
        ['sort', sort],
        ['limit', limit],
        ['full', full ? 'true' : undefined],
        ['cursor', cursor],
      ],
    });
    const models = Array.isArray(response.body) ? response.body : [];
    return {
      models,
      count: models.length,
      next_cursor: hfHub.parseNextCursor(response.headers),
    };
  },
});
