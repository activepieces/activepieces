import { createAction } from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';
import { hfViewer, hfViewerProps } from '../common/dataset-viewer';
import { checkDatasetViewerSupportOutputSchema } from '../output-schemas';

export const checkDatasetViewerSupport = createAction({
  auth: huggingFaceAuth,
  name: 'check_dataset_viewer_support',
  classification: 'READ',
  displayName: 'Check Dataset Viewer Support',
  description: 'Check which dataset viewer features (preview, rows, search, filter, statistics) a dataset supports.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Capability gate for every dataset viewer action: returns five booleans, preview (Preview Dataset Rows), viewer (Get Dataset Rows, parquet, size, info), search (Search Dataset Rows), filter (Filter Dataset Rows) and statistics (Get Column Statistics), optionally narrowed to one subset or split. Call it first whenever you are unsure whether a dataset is served. Private datasets are only served for PRO or Enterprise owners, gated ones only after access is granted. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: checkDatasetViewerSupportOutputSchema,
  props: {
    dataset: hfViewerProps.dataset(),
    config: hfViewerProps.optionalConfig(),
    split: hfViewerProps.optionalSplit(),
  },
  async run(context) {
    const { dataset, config, split } = context.propsValue;
    if (split?.trim() && !config?.trim()) {
      throw new Error('Split can only be checked together with a subset (config). Set Subset (Config) or clear Split.');
    }
    return hfViewer.request<unknown>({
      token: context.auth.secret_text,
      path: '/is-valid',
      dataset,
      query: [
        ['config', config?.trim()],
        ['split', split?.trim()],
      ],
    });
  },
});
