import { Property } from '@activepieces/pieces-framework';
import type { PropParams } from './props';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;
const DEFAULT_MAX_ROWS = 100;

function table<R extends boolean>({ required, displayName = 'Table', description = 'Table name, e.g. "person". Use List Tables to find it.' }: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function recordId<R extends boolean>({ required, displayName = 'Record ID', description = 'Full record id in "table:id" form, e.g. "person:tobie", as returned in the id field by Find Records, Create Record and the other record actions.' }: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function filters<R extends boolean>({
  required,
  displayName = 'Filters',
  description = 'JSON object of conditions, all combined with AND. {"field": value} matches equality; {"field": {"$gt": 18}} uses an operator: $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $contains, $containsNot, $containsAny, $containsAll, $exists (true/false). Nested fields use dots ("address.city"). Wrap a value as {"$record": "user:tobie"}, {"$datetime": "2024-01-01T00:00:00Z"}, {"$decimal": "1.50"}, {"$uuid": "..."} or {"$duration": "1h"} to compare against that SurrealDB type; plain strings stay strings.',
}: PropParams<R>) {
  return Property.Json({ displayName, description, required });
}

function data<R extends boolean>({ required, displayName = 'Data', description = 'JSON object of field values, e.g. {"name": "Tobie", "age": 33}. Strings are stored as strings; use Run Query to store record links or datetimes.' }: PropParams<R>) {
  return Property.Json({ displayName, description, required });
}

function limit<R extends boolean>({ required, displayName = 'Limit', description = `Max records to return (1-${MAX_LIMIT}). Defaults to ${DEFAULT_LIMIT}.` }: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function maxRows<R extends boolean>({ required, displayName = 'Max Rows', description = `Safety limit: if the filters match more records than this, nothing is changed and the action fails. Defaults to ${DEFAULT_MAX_ROWS}.` }: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

export const surrealdbAiProps = { table, recordId, filters, data, limit, maxRows, DEFAULT_LIMIT, MAX_LIMIT, DEFAULT_MAX_ROWS };
