import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfViewerProps } from '../common/dataset-viewer';
import { hfHub } from '../common/hub-client';
import { hfRepo } from '../common/repo';
import { hfUtils } from '../common/utils';
import { getDatasetLeaderboardOutputSchema } from '../output-schemas';

export const getDatasetLeaderboard = createAction({
  auth: huggingFaceAuth,
  name: 'get_dataset_leaderboard',
  classification: 'SEARCH',
  displayName: 'Get Dataset Leaderboard',
  description: 'Get the models ranked by their evaluation score on a benchmark dataset.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the Hub leaderboard of a benchmark dataset (for example openai/gsm8k or TIGER-Lab/MMLU-Pro): models ranked by their reported evaluation score, each with rank, model_id, score value, whether lower is better, parameter count, verification status and the source of the result. Most non-benchmark datasets return an empty list. Filter by task, maximum model size, or base models versus fine-tunes; use Get Model for details of a ranked model. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getDatasetLeaderboardOutputSchema,
  props: {
    dataset: hfViewerProps.dataset(),
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description:
        "Optional benchmark task for datasets with several tasks, for example 'gsm8k'. It matches the eval result file name (.eval_results/<task>.yaml). Leave empty for the default task.",
      required: false,
    }),
    max_params: Property.ShortText({
      displayName: 'Max Parameters',
      description: "Only models up to this size, for example '10B', '500M' or a raw count such as '7000000000'.",
      required: false,
    }),
    base_model: Property.StaticDropdown({
      displayName: 'Model Scope',
      description:
        'Leave empty for the Hub default (base models only), or include fine-tuned and derived models as well.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Base models only', value: 'true' },
          { label: 'Include fine-tuned models', value: 'false' },
        ],
      },
    }),
  },
  async run(context) {
    const { dataset, task_id, max_params, base_model } = context.propsValue;
    const token = context.auth.secret_text;
    const apiPath = await hfRepo.apiPath({ token, repoType: 'dataset', repoId: dataset });
    const response = await hfHub.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `${apiPath}/leaderboard`,
      query: [
        ['task_id', task_id?.trim()],
        ['max_params', max_params?.trim()],
        ['base_model', hfUtils.booleanFlag(base_model)],
      ],
    });
    const entries = Array.isArray(response.body) ? response.body.map(flattenEntry) : [];
    return {
      entries,
      count: entries.length,
    };
  },
});

function flattenEntry(entry: unknown): LeaderboardEntry {
  const record = hfHub.isRecord(entry) ? entry : {};
  const author = hfHub.isRecord(record['author']) ? record['author'] : {};
  const source = hfHub.isRecord(record['source']) ? record['source'] : {};
  return {
    rank: numberOrNull(record['rank']),
    model_id: stringOrNull(record['modelId']),
    value: numberOrNull(record['value']),
    lower_is_better: record['lower_is_better'] === true,
    num_parameters: numberOrNull(record['num_parameters']),
    verified: record['verified'] === true,
    author_name: stringOrNull(author['name']),
    author_fullname: stringOrNull(author['fullname']),
    author_type: stringOrNull(author['type']),
    source_name: stringOrNull(source['name']),
    source_url: stringOrNull(source['url']),
    source_is_external: source['isExternal'] === true,
    pull_request: numberOrNull(record['pullRequest']),
    filename: stringOrNull(record['filename']),
  };
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

type LeaderboardEntry = {
  rank: number | null;
  model_id: string | null;
  value: number | null;
  lower_is_better: boolean;
  num_parameters: number | null;
  verified: boolean;
  author_name: string | null;
  author_fullname: string | null;
  author_type: string | null;
  source_name: string | null;
  source_url: string | null;
  source_is_external: boolean;
  pull_request: number | null;
  filename: string | null;
};
