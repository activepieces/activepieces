import { createAction } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '../../auth';
import { surrealdbAiProps } from '../../common/ai-props';
import { surrealdbApi } from '../../common/api';
import { surrealdbDescribeTableOutputSchema } from '../../output-schemas';

export const describeTableAction = createAction({
  auth: surrealdbAuth,
  name: 'surrealdb_describe_table',
  outputSchema: surrealdbDescribeTableOutputSchema,
  displayName: 'Describe Table',
  description: 'Gets a table\'s fields, indexes, events and views.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the defined fields (name, type, readonly, permissions), indexes, events, live queries and views of one table. Schemaless tables may hold fields that are not defined here; Find Records shows real data. Fails when the table does not exist; table names come from List Tables. Read-only.',
    idempotent: true,
  },
  props: {
    table: surrealdbAiProps.table({ required: true }),
  },
  async run(context) {
    return await surrealdbApi.rpcQuery<Record<string, unknown>>({
      auth: context.auth,
      sql: 'IF $table NOTINSIDE (INFO FOR DB STRUCTURE).tables.name { THROW "Table \'" + $table + "\' does not exist. Use List Tables to see the tables."; }; INFO FOR TABLE $table STRUCTURE;',
      vars: { table: context.propsValue.table },
    });
  },
});
