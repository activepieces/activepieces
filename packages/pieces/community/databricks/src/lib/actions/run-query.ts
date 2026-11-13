import { createAction, Property } from '@activepieces/pieces-framework';

import { databricksAuth } from '../auth';
import { databricksApi } from '../common/api';
import { databricksProps } from '../common/props';
import { databricksUtils } from '../common/utils';
import { queryResultOutputSchema } from '../output-schemas';

export const runQueryAction = createAction({
  auth: databricksAuth,
  name: 'run_query',
  classification: 'WRITE',
  displayName: 'Run SQL Query',
  description:
    'Runs any SQL statement on a SQL warehouse and returns the result rows.',
  audience: 'both',
  aiMetadata: {
    description:
      'Run an arbitrary Databricks SQL statement (SELECT, INSERT, MERGE, DDL, ...) on a SQL warehouse and return its rows. Prefer the table actions for simple reads and writes; use this for joins, aggregates or anything they cannot express. Pass user values as :named parameters, never inline. Retry safety depends on the statement.',
    idempotent: false,
  },
  props: {
    warehouseId: databricksProps.warehouseId({ required: true }),
    query: Property.LongText({
      displayName: 'SQL Query',
      description:
        'The SQL statement to run. Use fully qualified table names and :name markers for values, e.g. SELECT * FROM main.sales.orders WHERE status = :status LIMIT 100',
      required: true,
    }),
    parameters: Property.Object({
      displayName: 'Parameters',
      description:
        'Values for the :name markers in the query, e.g. status → shipped. Values are passed as strings; cast in SQL when needed, e.g. CAST(:amount AS DECIMAL(10,2)).',
      required: false,
    }),
  },
  outputSchema: queryResultOutputSchema,
  async run(context) {
    const { warehouseId, query, parameters } = context.propsValue;
    return await databricksApi.executeStatement({
      auth: context.auth,
      warehouseId,
      statement: query,
      parameters: Object.entries(parameters ?? {}).map(([name, value]) => ({
        name,
        value: databricksUtils.toParameterValue({ value }),
      })),
    });
  },
});
