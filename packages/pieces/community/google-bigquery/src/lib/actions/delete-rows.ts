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

export const deleteRowsAction = createAction({
  auth: bigQueryAuth,
  name: 'delete_rows',
  displayName: 'Delete Rows',
  description:
    'Deletes one or more rows from a BigQuery table using a SQL WHERE condition.',
  props: {
    project_id: projectIdProp,
    dataset_id: datasetIdProp,
    table_id: tableIdProp,
    where_clause: Property.LongText({
      displayName: 'WHERE Clause',
      description:
        'SQL condition to match the rows to delete. Do not include the WHERE keyword. Example: `status = "inactive" AND created_at < "2023-01-01"`',
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
    const { project_id, dataset_id, table_id, where_clause, location } =
      context.propsValue;
    const token = await getAccessToken(context.auth as BigQueryAuthValue);

    const fullTable = `\`${project_id}.${dataset_id}.${table_id}\``;
    const query = `DELETE FROM ${fullTable} WHERE ${where_clause}`;

    const result = await runDmlQuery(
      token,
      project_id as string,
      query,
      (location as string) ?? undefined
    );

    return {
      success: true,
      rows_deleted: result.deletedRowCount,
      job_id: result.jobId,
    };
  },
});
