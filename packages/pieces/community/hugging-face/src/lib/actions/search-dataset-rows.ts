import { createAction, Property } from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';
import { hfViewer, hfViewerProps } from '../common/dataset-viewer';
import { getDatasetRowsOutputSchema } from '../output-schemas';

export const searchDatasetRows = createAction({
  auth: huggingFaceAuth,
  name: 'search_dataset_rows',
  classification: 'SEARCH',
  displayName: 'Search Dataset Rows',
  description: 'Full-text search over the text columns of a dataset split.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Full-text searches the string columns of one dataset split and returns one page of up to 100 matching rows with their original row_idx, plus num_rows_total (total matches) and next_offset for paging. Only works when Check Dataset Viewer Support reports search:true (call it first when unsure). For exact column conditions such as label=1 use Filter Dataset Rows instead. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getDatasetRowsOutputSchema,
  props: {
    dataset: hfViewerProps.dataset(),
    config: hfViewerProps.config(),
    split: hfViewerProps.split(),
    query: Property.ShortText({
      displayName: 'Query',
      description: "Words to look for in the text columns, for example 'wonderful acting'.",
      required: true,
    }),
    offset: hfViewerProps.offset(),
    length: hfViewerProps.length(),
  },
  async run(context) {
    const { dataset, config, split, query } = context.propsValue;
    const { offset, length } = hfViewer.validatePaging({
      offset: context.propsValue.offset,
      length: context.propsValue.length,
    });
    const text = query.trim();
    if (text.length === 0) {
      throw new Error('Query must not be empty.');
    }
    const body = await hfViewer.request<unknown>({
      token: context.auth.secret_text,
      path: '/search',
      dataset,
      query: [
        ['config', config.trim()],
        ['split', split.trim()],
        ['query', text],
        ['offset', offset],
        ['length', length],
      ],
    });
    return hfViewer.withPaging({ body, offset });
  },
});
