import { createAction } from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';
import { hfViewer, hfViewerProps } from '../common/dataset-viewer';
import { getDatasetSizeOutputSchema } from '../output-schemas';

export const getDatasetSize = createAction({
  auth: huggingFaceAuth,
  name: 'get_dataset_size',
  classification: 'READ',
  displayName: 'Get Dataset Size',
  description: 'Get the number of rows and bytes of a dataset, per subset and per split.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns row counts, column counts and byte sizes (original files, parquet, in memory) for the whole dataset, each subset (config) and each split, optionally narrowed to one subset. Use it to decide how many pages Get Dataset Rows would need or whether a download is practical. If unsure the viewer serves this dataset, call Check Dataset Viewer Support first. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getDatasetSizeOutputSchema,
  props: {
    dataset: hfViewerProps.dataset(),
    config: hfViewerProps.optionalConfig(),
  },
  async run(context) {
    const { dataset, config } = context.propsValue;
    return hfViewer.request<unknown>({
      token: context.auth.secret_text,
      path: '/size',
      dataset,
      query: [['config', config?.trim()]],
    });
  },
});
