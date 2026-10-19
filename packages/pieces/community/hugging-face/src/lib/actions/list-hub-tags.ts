import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { listHubTagsOutputSchema } from '../output-schemas';

const MODEL_TAG_TYPES = [
  'pipeline_tag',
  'library',
  'dataset',
  'language',
  'license',
  'arxiv',
  'doi',
  'region',
  'deploy',
  'other',
];

const DATASET_TAG_TYPES = [
  'benchmark',
  'task_categories',
  'task_ids',
  'size_categories',
  'modality',
  'format',
  'library',
  'language',
  'license',
  'arxiv',
  'doi',
  'region',
  'annotations_creators',
  'language_creators',
  'multilinguality',
  'source_datasets',
  'other',
];

export const listHubTags = createAction({
  auth: huggingFaceAuth,
  name: 'list_hub_tags',
  classification: 'SEARCH',
  displayName: 'List Hub Tags by Type',
  description: 'List the tags available for filtering models or datasets, grouped by tag type.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the Hub's valid filter tags for models or datasets, grouped by tag type (for models: pipeline_tag, library, language, license and more; for datasets: task_categories, size_categories, modality, format and more). Call it to find the exact 'filter' values to pass to Search Models or Search Datasets. Spaces have no tag catalogue. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: listHubTagsOutputSchema,
  props: {
    repo_type: Property.StaticDropdown({
      displayName: 'Repository Type',
      description: "Whose tags to list: 'model' or 'dataset'.",
      required: true,
      defaultValue: 'model',
      options: {
        disabled: false,
        options: [
          { label: 'Model', value: 'model' },
          { label: 'Dataset', value: 'dataset' },
        ],
      },
    }),
    tag_type: Property.ShortText({
      displayName: 'Tag Type',
      description: `Only tags of this type. Models: ${MODEL_TAG_TYPES.join(', ')}. Datasets: ${DATASET_TAG_TYPES.join(', ')}. Leave empty for every type (large).`,
      required: false,
    }),
  },
  async run(context) {
    const { repo_type, tag_type } = context.propsValue;
    const allowed = repo_type === 'dataset' ? DATASET_TAG_TYPES : MODEL_TAG_TYPES;
    const tagType = tag_type?.trim();
    if (tagType && !allowed.includes(tagType)) {
      throw new Error(`Unknown tag type '${tagType}' for ${repo_type}s. Use one of: ${allowed.join(', ')}.`);
    }
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: repo_type === 'dataset' ? '/api/datasets-tags-by-type' : '/api/models-tags-by-type',
      query: [['type', tagType]],
    });
    return response.body;
  },
});
