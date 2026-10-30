import { createAction } from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';
import { hfViewer, hfViewerProps } from '../common/dataset-viewer';
import { hfHub } from '../common/hub-client';
import { listDatasetSplitsOutputSchema } from '../output-schemas';

export const listDatasetSplits = createAction({
  auth: huggingFaceAuth,
  name: 'list_dataset_splits',
  classification: 'SEARCH',
  displayName: 'List Dataset Subsets & Splits',
  description: 'List the subsets (configs) and splits of a dataset in the dataset viewer.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists every subset (config) and split of a dataset, the resolver for the config and split inputs of every other dataset viewer action; pending lists subsets still being processed and failed lists subsets the viewer could not process. If unsure whether the dataset is served at all, call Check Dataset Viewer Support first. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: listDatasetSplitsOutputSchema,
  props: {
    dataset: hfViewerProps.dataset(),
    config: hfViewerProps.optionalConfig(),
  },
  async run(context) {
    const { dataset, config } = context.propsValue;
    const body = await hfViewer.request<unknown>({
      token: context.auth.secret_text,
      path: '/splits',
      dataset,
      query: [['config', config?.trim()]],
    });
    const record = hfHub.isRecord(body) ? body : {};
    const splits = Array.isArray(record['splits']) ? record['splits'] : [];
    return {
      splits,
      count: splits.length,
      pending: Array.isArray(record['pending']) ? record['pending'] : [],
      failed: Array.isArray(record['failed']) ? record['failed'] : [],
    };
  },
});
