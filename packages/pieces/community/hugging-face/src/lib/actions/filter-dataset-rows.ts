import { createAction, Property } from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';
import { hfViewer, hfViewerProps } from '../common/dataset-viewer';
import { getDatasetRowsOutputSchema } from '../output-schemas';

export const filterDatasetRows = createAction({
  auth: huggingFaceAuth,
  name: 'filter_dataset_rows',
  classification: 'SEARCH',
  displayName: 'Filter Dataset Rows',
  description: 'Get the rows of a dataset split that match a SQL-like condition, optionally sorted.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns one page of up to 100 rows from a dataset split that match a SQL-like WHERE condition, optionally sorted, plus num_rows_total (total matches) and next_offset for paging. Column names must be double-quoted, for example \"label\"=1 AND \"idx\">100; get column names from Preview Dataset Rows or Get Dataset Schema & Info. Only works when Check Dataset Viewer Support reports filter:true (call it first when unsure); for free-text matching use Search Dataset Rows. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getDatasetRowsOutputSchema,
  props: {
    dataset: hfViewerProps.dataset(),
    config: hfViewerProps.config(),
    split: hfViewerProps.split(),
    where: Property.LongText({
      displayName: 'Where',
      description:
        'SQL-like condition with double-quoted column names, for example "label"=1 or "score">0.5 AND "lang"=\'en\'. String values use single quotes.',
      required: false,
    }),
    orderby: Property.ShortText({
      displayName: 'Order By',
      description: 'Optional sort with double-quoted column names, for example "idx" DESC or "score" ASC.',
      required: false,
    }),
    offset: hfViewerProps.offset(),
    length: hfViewerProps.length(),
  },
  async run(context) {
    const { dataset, config, split, where, orderby } = context.propsValue;
    const { offset, length } = hfViewer.validatePaging({
      offset: context.propsValue.offset,
      length: context.propsValue.length,
    });
    const condition = where?.trim();
    const order = orderby?.trim();
    if (!condition && !order) {
      throw new Error('Set Where, Order By, or both. To read rows without a condition use Get Dataset Rows.');
    }
    const body = await hfViewer.request<unknown>({
      token: context.auth.secret_text,
      path: '/filter',
      dataset,
      query: [
        ['config', config.trim()],
        ['split', split.trim()],
        ['where', condition],
        ['orderby', order],
        ['offset', offset],
        ['length', length],
      ],
    });
    return hfViewer.withPaging({ body, offset });
  },
});
