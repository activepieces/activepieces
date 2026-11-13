import { createAction } from '@activepieces/pieces-framework';
import { mongodbAuth } from '../../auth';
import { mongodbClient } from '../../common/client';
import { mongodbListDatabasesOutputSchema } from '../../output-schemas';

export const listDatabasesAction = createAction({
  auth: mongodbAuth,
  name: 'mongodb_list_databases',
  outputSchema: mongodbListDatabasesOutputSchema,
  displayName: 'List Databases',
  description: 'List the databases on the MongoDB server.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the databases the connection can see, with their size on disk. Use it to find a database name for the other MongoDB actions.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const client = await mongodbClient.create({ auth: context.auth });
    try {
      return await client.db('admin').admin().listDatabases();
    } finally {
      await client.close();
    }
  },
});
