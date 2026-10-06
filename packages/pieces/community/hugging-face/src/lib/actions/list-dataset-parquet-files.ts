import { createAction } from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';
import { hfViewer, hfViewerProps } from '../common/dataset-viewer';
import { hfHub } from '../common/hub-client';
import { listDatasetParquetFilesOutputSchema } from '../output-schemas';

export const listDatasetParquetFiles = createAction({
  auth: huggingFaceAuth,
  name: 'list_dataset_parquet_files',
  classification: 'SEARCH',
  displayName: 'List Parquet Files',
  description: 'List the auto-converted Parquet files of a dataset, with their download URLs and sizes.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the Parquet files the dataset viewer converted a dataset into (under the refs/convert/parquet revision), one entry per file with its subset (config), split, filename, size in bytes and download URL, optionally narrowed to one subset. The URLs are binary download URLs for external tools, not readable with Read Repo File; to read rows use Get Dataset Rows. If unsure the viewer serves this dataset, call Check Dataset Viewer Support first. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: listDatasetParquetFilesOutputSchema,
  props: {
    dataset: hfViewerProps.dataset(),
    config: hfViewerProps.optionalConfig(),
  },
  async run(context) {
    const { dataset, config } = context.propsValue;
    const body = await hfViewer.request<unknown>({
      token: context.auth.secret_text,
      path: '/parquet',
      dataset,
      query: [['config', config?.trim()]],
    });
    const record = hfHub.isRecord(body) ? body : {};
    const files = Array.isArray(record['parquet_files']) ? record['parquet_files'] : [];
    return {
      parquet_files: files,
      count: files.length,
      pending: Array.isArray(record['pending']) ? record['pending'] : [],
      failed: Array.isArray(record['failed']) ? record['failed'] : [],
      partial: record['partial'] === true,
    };
  },
});
