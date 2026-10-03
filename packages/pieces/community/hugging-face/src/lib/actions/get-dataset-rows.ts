import { createAction } from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';
import { hfViewer, hfViewerProps } from '../common/dataset-viewer';
import { getDatasetRowsOutputSchema } from '../output-schemas';

export const getDatasetRows = createAction({
  auth: huggingFaceAuth,
  name: 'get_dataset_rows',
  classification: 'SEARCH',
  displayName: 'Get Dataset Rows',
  description: 'Get a page of rows (up to 100) from a dataset split, by offset.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns one page of up to 100 rows from a dataset split starting at offset, plus the column features, num_rows_total and next_offset (null on the last page) for paging; partial:true means the viewer only indexed part of a very large split. Needs viewer:true from Check Dataset Viewer Support (call it first when unsure); otherwise use Preview Dataset Rows. For keyword or condition queries use Search Dataset Rows or Filter Dataset Rows. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getDatasetRowsOutputSchema,
  props: {
    dataset: hfViewerProps.dataset(),
    config: hfViewerProps.config(),
    split: hfViewerProps.split(),
    offset: hfViewerProps.offset(),
    length: hfViewerProps.length(),
  },
  async run(context) {
    const { dataset, config, split } = context.propsValue;
    const { offset, length } = hfViewer.validatePaging({
      offset: context.propsValue.offset,
      length: context.propsValue.length,
    });
    const body = await hfViewer.request<unknown>({
      token: context.auth.secret_text,
      path: '/rows',
      dataset,
      query: [
        ['config', config.trim()],
        ['split', split.trim()],
        ['offset', offset],
        ['length', length],
      ],
    });
    return hfViewer.withPaging({ body, offset });
  },
});
