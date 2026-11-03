import { DropdownState, Property } from '@activepieces/pieces-framework';
import type { MongoClient } from 'mongodb';
import { mongodbAuth } from '../auth';
import { mongodbClient } from './client';

function database<R extends boolean>({
  required,
  displayName = 'Database',
  description = 'Leave empty to use the database from your connection.',
}: PropParams<R>) {
  return Property.ShortText({
    displayName,
    description,
    required,
    placeholder: 'my_database',
    width: 'half',
  });
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
    width: 'half',
    refreshers: ['database'],
    options: async ({ auth, database }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Connect first' });
      }

      const databaseName =
        (typeof database === 'string' && database) || auth.props.database;

      if (!databaseName) {
        return disabledOptions({
          placeholder: 'Set a database',
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
      } catch {
        return disabledOptions({
          placeholder: 'Could not load',
        });
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
  const db = client.db(databaseName);
  const collections = await db.listCollections().toArray();
  return collections.map((collection) => collection.name);
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
