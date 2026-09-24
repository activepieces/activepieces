import { createAction, Property } from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';
import { hfViewer, hfViewerProps } from '../common/dataset-viewer';
import { hfHub } from '../common/hub-client';
import { hfUtils } from '../common/utils';
import { previewDatasetRowsOutputSchema } from '../output-schemas';

export const previewDatasetRows = createAction({
  auth: huggingFaceAuth,
  name: 'preview_dataset_rows',
  classification: 'READ',
  displayName: 'Preview Dataset Rows',
  description: 'Get the first rows (up to 100) of a dataset split, with its column types.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the column features and the first rows (up to 100, default 20) of one dataset split. Works whenever Check Dataset Viewer Support reports preview:true, even when viewer:false makes Get Dataset Rows unavailable; use Get Dataset Rows instead to page past the first rows. Long cell values are cut and listed per row in truncated_cells. Resolve config and split with List Dataset Subsets & Splits. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: previewDatasetRowsOutputSchema,
  props: {
    dataset: hfViewerProps.dataset(),
    config: hfViewerProps.config(),
    split: hfViewerProps.split(),
    max_rows: Property.Number({
      displayName: 'Max Rows',
      description: 'How many of the first rows to return (1 to 100). Defaults to 20.',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { dataset, config, split, max_rows } = context.propsValue;
    hfUtils.assertLimit({ value: max_rows, min: 1, max: 100, name: 'Max Rows' });
    const body = await hfViewer.request<unknown>({
      token: context.auth.secret_text,
      path: '/first-rows',
      dataset,
      query: [
        ['config', config.trim()],
        ['split', split.trim()],
      ],
    });
    const record = hfHub.isRecord(body) ? body : {};
    const allRows = Array.isArray(record['rows']) ? record['rows'] : [];
    const rows = allRows.slice(0, max_rows ?? 20);
    return {
      ...record,
      rows,
      count: rows.length,
      rows_available: allRows.length,
    };
  },
});
