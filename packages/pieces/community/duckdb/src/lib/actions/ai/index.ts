import { duckdbCompareDatasets } from './compare/compare-datasets';
import { duckdbDeduplicateRows } from './compare/deduplicate-rows';
import { duckdbDescribeData } from './profile/describe-data';
import { duckdbSummarizeData } from './profile/summarize-data';
import { duckdbRunQuery } from './query/run-query';

export const duckdbAiActions = [
  duckdbRunQuery,
  duckdbDescribeData,
  duckdbSummarizeData,
  duckdbCompareDatasets,
  duckdbDeduplicateRows,
];
