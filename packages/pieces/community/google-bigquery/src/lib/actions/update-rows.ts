import { createAction, Property } from '@activepieces/pieces-framework';
import {
  bigQueryAuth,
  BigQueryAuthValue,
  getAccessToken,
  runDmlQuery,
  projectIdProp,
  datasetIdProp,
  tableIdProp,
} from '../common';

export const updateRowsAction = createAction({
  auth: bigQueryAuth,
  name: 'update_rows',
  displayName: 'Update Row(s)',
  description:
    'Updates one or more existing rows in a BigQuery table using SQL SET and WHERE expressions.',
  props: {
    project_id: projectIdProp,
    dataset_id: datasetIdProp,
    table_id: tableIdProp,
    set_expression: Property.LongText({
      displayName: 'SET Expression',
      description:
        'Comma-separated column assignments. Do not include the SET keyword. Example: `status = "active", updated_at = CURRENT_TIMESTAMP()`',
      required: true,
    }),
    where_clause: Property.LongText({
      displayName: 'WHERE Clause',
      description:
        'SQL condition to match the rows to update. Do not include the WHERE keyword. Example: `id = "abc123"`',
      required: true,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description:
        'Dataset location (e.g. US, EU). Leave blank to use the default.',
      required: false,
    }),
  },
  async run(context) {
    const {
      project_id,
      dataset_id,
      table_id,
      set_expression,
      where_clause,
      location,
    } = context.propsValue;
    const token = await getAccessToken(context.auth as BigQueryAuthValue);

    const fullTable = `\`${project_id}.${dataset_id}.${table_id}\``;
    const query = `UPDATE ${fullTable} SET ${set_expression} WHERE ${where_clause}`;

    const result = await runDmlQuery(
      token,
      project_id as string,
      query,
      (location as string) ?? undefined
    );

    return {
      success: true,
      rows_updated: result.updatedRowCount,
      job_id: result.jobId,
    };
  },
});
