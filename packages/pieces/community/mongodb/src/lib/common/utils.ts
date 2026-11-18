import type { MongodbAuthValue } from './types';

function databaseName({ auth, database }: { auth: MongodbAuthValue; database?: string }): string {
  const name = database || auth.props.database;
  if (!name) {
    throw new Error('Database is required. Please specify it in the connection settings or in this action.');
  }
  return name;
}

function limit({ value }: { value?: number }): number {
  return Math.min(Math.max(value ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
}

export const mongodbUtils = { databaseName, limit };

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;
