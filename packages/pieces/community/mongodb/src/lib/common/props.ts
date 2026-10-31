import { DropdownState, Property } from '@activepieces/pieces-framework';
import type { MongoClient } from 'mongodb';
import { mongodbAuth } from '../auth';
import { mongodbClient } from './client';

function database<R extends boolean>({
  required,
  displayName = 'Database',
  description = 'The MongoDB database to connect to (from your authentication)',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function collection<R extends boolean>({
  required,
  displayName = 'Collection',
  description,
}: PropParams<R>) {
  return Property.Dropdown({
    auth: mongodbAuth,
    displayName,
    description,
    required,
    refreshers: ['database'],
    options: async ({ auth, database }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Connect to MongoDB first' });
      }

      const databaseName =
        (typeof database === 'string' && database) || auth.props.database;

      if (!databaseName) {
        return disabledOptions({
          placeholder: 'Database is required in authentication or action',
        });
      }

      const client = await mongodbClient.create({ auth });

      try {
        const collections = await listCollectionNames({ client, databaseName });
        return {
          disabled: false,
          options: collections.map((collection) => ({
            label: collection,
            value: collection,
          })),
        };
      } finally {
        await client.close();
      }
    },
  });
}

async function listCollectionNames({
  client,
  databaseName,
}: {
  client: MongoClient;
  databaseName: string;
}): Promise<string[]> {
  try {
    const db = client.db(databaseName);
    const collections = await db.listCollections().toArray();
    return collections.map((collection) => collection.name);
  } catch {
    return [];
  }
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const mongodbProps = { database, collection };

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
