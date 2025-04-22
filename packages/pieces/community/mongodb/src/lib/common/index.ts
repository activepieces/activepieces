import { PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { MongoClient, Db, ServerApiVersion } from 'mongodb';
import { mongodbAuth } from '../..';

export async function mongodbConnect(
  auth: PiecePropValueSchema<typeof mongodbAuth>
): Promise<MongoClient> {
  try {
    if (!auth.host || !auth.username || !auth.password) {
      throw new Error('Host, username, and password are required');
    }

    // Build connection string based on whether it's Atlas or standard MongoDB
    const authSource = auth.authSource || 'admin';
    const protocol = auth.useAtlasUrl ? 'mongodb+srv://' : 'mongodb://';

    let connectionString = `${protocol}${auth.username}:${encodeURIComponent(
      auth.password
    )}@${auth.host}`;

    if (auth.database) {
      connectionString += `/${auth.database}`;
    }

    connectionString += `?authSource=${authSource}`;

    // Add common MongoDB Atlas parameters if using Atlas URL format
    const finalConnectionString = auth.useAtlasUrl
      ? `${connectionString}&retryWrites=true&w=majority`
      : connectionString;

    const client = new MongoClient(finalConnectionString, {
      connectTimeoutMS: 10000, // 10 seconds timeout for connection
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout for server selection
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();

    // For validation purposes, just ping the server
    await client.db('admin').command({ ping: 1 });

    console.log('MongoDB connection successful');
    return client;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to connect to MongoDB: ${errorMessage}`);
  }
}

export async function getDatabase(
  client: MongoClient,
  databaseName?: string
): Promise<Db> {
  return client.db(databaseName);
}

export async function getCollections(
  client: MongoClient,
  databaseName: string
): Promise<string[]> {
  try {
    const db = client.db(databaseName);
    const collections = await db.listCollections().toArray();
    return collections.map((collection) => collection.name);
  } catch (error) {
    console.error('Error getting collections:', error);
    return [];
  }
}

export const mongodbCommon = {
  database: Property.ShortText({
    displayName: 'Database',
    description:
      'The MongoDB database to connect to (from your authentication)',
    required: false,
  }),
  collection: (required = true) =>
    Property.Dropdown({
      displayName: 'Collection',
      required,
      refreshers: ['database'],
      options: async ({ auth, database }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect to MongoDB first',
            options: [],
          };
        }

        const typedAuth = auth as PiecePropValueSchema<typeof mongodbAuth>;
        const databaseName = database as string || typedAuth.database;

        if (!databaseName) {
          return {
            disabled: true,
            placeholder: 'Database is required in authentication or action',
            options: [],
          };
        }

        const client = await mongodbConnect(typedAuth);

        try {
          const collections = await getCollections(client, databaseName);
          return {
            disabled: false,
            options: collections.map((collection: string) => {
              return {
                label: collection,
                value: collection,
              };
            }),
          };
        } finally {
          await client.close();
        }
      },
    }),
};
