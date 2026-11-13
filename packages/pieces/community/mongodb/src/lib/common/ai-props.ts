import { Property } from '@activepieces/pieces-framework';
import type { PropParams } from './props';

function database<R extends boolean>({
  required,
  displayName = 'Database',
  description = 'Database name. Defaults to the database in the connection. Use List Databases to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function collection<R extends boolean>({
  required,
  displayName = 'Collection',
  description = 'Collection name, e.g. "users". Use List Collections to find it.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function filter<R extends boolean>({
  required,
  displayName = 'Filter',
  description = `MongoDB query object, e.g. {"status": "active"}. ${EXTENDED_JSON_HINT}`,
}: PropParams<R>) {
  return Property.Json({ displayName, description, required });
}

function update<R extends boolean>({
  required,
  displayName = 'Update',
  description = `MongoDB update operators, e.g. {"$set": {"status": "done"}, "$inc": {"views": 1}}. ${EXTENDED_JSON_HINT}`,
}: PropParams<R>) {
  return Property.Json({ displayName, description, required });
}

function upsert<R extends boolean>({
  required,
  displayName = 'Upsert',
  description = 'Insert a new document when nothing matches the filter. Defaults to false.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: { options: BOOLEAN_OPTIONS },
  });
}

function projection<R extends boolean>({
  required,
  displayName = 'Projection',
  description = 'Fields to include or exclude, e.g. {"name": 1, "_id": 0}. Omit to return every field.',
}: PropParams<R>) {
  return Property.Json({ displayName, description, required });
}

function limit<R extends boolean>({
  required,
  displayName = 'Limit',
  description = 'Maximum number of results to return (1-1000). Defaults to 100.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

export const mongodbAiProps = { database, collection, filter, update, upsert, projection, limit };

const EXTENDED_JSON_HINT =
  'Use MongoDB Extended JSON for special types: {"$oid": "<24-hex id>"} for an ObjectId, {"$date": "<ISO date>"} for a date.';

const BOOLEAN_OPTIONS = [
  { label: 'True', value: 'true' },
  { label: 'False', value: 'false' },
];
