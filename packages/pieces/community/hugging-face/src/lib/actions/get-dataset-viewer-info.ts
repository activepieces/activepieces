import { createAction } from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';
import { hfViewer, hfViewerProps } from '../common/dataset-viewer';
import { getDatasetViewerInfoOutputSchema } from '../output-schemas';

export const getDatasetViewerInfo = createAction({
  auth: huggingFaceAuth,
  name: 'get_dataset_viewer_info',
  classification: 'READ',
  displayName: 'Get Dataset Schema & Info',
  description: 'Get the column schema (features), description, license, citation and split sizes of a dataset.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the dataset viewer's info for a dataset: column features (the schema, including class label names), description, license, citation, homepage and per-split example counts and bytes. With a subset (config), dataset_info describes that subset; without one, dataset_info is keyed by subset name. Use Get Dataset instead for Hub repository metadata (tags, files, downloads); if unsure the viewer serves this dataset, call Check Dataset Viewer Support first. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getDatasetViewerInfoOutputSchema,
  props: {
    dataset: hfViewerProps.dataset(),
    config: hfViewerProps.optionalConfig(),
  },
  async run(context) {
    const { dataset, config } = context.propsValue;
    return hfViewer.request<unknown>({
      token: context.auth.secret_text,
      path: '/info',
      dataset,
      query: [['config', config?.trim()]],
    });
  },
});
