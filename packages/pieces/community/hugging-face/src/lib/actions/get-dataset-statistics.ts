import { createAction } from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';
import { hfViewer, hfViewerProps } from '../common/dataset-viewer';
import { getDatasetStatisticsOutputSchema } from '../output-schemas';

export const getDatasetStatistics = createAction({
  auth: huggingFaceAuth,
  name: 'get_dataset_statistics',
  classification: 'READ',
  displayName: 'Get Column Statistics',
  description: 'Get per-column statistics (counts, nulls, min/max/mean, histograms, label frequencies) of a dataset split.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns per-column statistics for one dataset split: null counts and proportions, min, max, mean, median, standard deviation and histograms for numeric and text-length columns, and value frequencies for class labels and booleans; partial:true means they were computed on a sample. Only works when Check Dataset Viewer Support reports statistics:true (call it first when unsure). Resolve config and split with List Dataset Subsets & Splits. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getDatasetStatisticsOutputSchema,
  props: {
    dataset: hfViewerProps.dataset(),
    config: hfViewerProps.config(),
    split: hfViewerProps.split(),
  },
  async run(context) {
    const { dataset, config, split } = context.propsValue;
    return hfViewer.request<unknown>({
      token: context.auth.secret_text,
      path: '/statistics',
      dataset,
      query: [
        ['config', config.trim()],
        ['split', split.trim()],
      ],
    });
  },
});
