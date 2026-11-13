import { MongoClient, ServerApiVersion } from 'mongodb';
import type { MongodbAuthValue } from './types';

async function create({ auth }: { auth: MongodbAuthValue }): Promise<MongoClient> {
  try {
    const props = auth.props;
    if (!props.host || !props.username || !props.password) {
      throw new Error('Host, username, and password are required');
    }

    const authSource = props.authSource || 'admin';
    const protocol = props.useAtlasUrl ? 'mongodb+srv://' : 'mongodb://';

    let connectionString = `${protocol}${props.username}:${encodeURIComponent(
      props.password
    )}@${props.host}`;

    if (props.database) {
      connectionString += `/${props.database}`;
    }

    connectionString += `?authSource=${authSource}`;

    const finalConnectionString = props.useAtlasUrl
      ? `${connectionString}&retryWrites=true&w=majority`
      : connectionString;

    const client = new MongoClient(finalConnectionString, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();

    await client.db('admin').command({ ping: 1 });

    return client;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to connect to MongoDB: ${errorMessage}`);
  }
}

export const mongodbClient = { create };
