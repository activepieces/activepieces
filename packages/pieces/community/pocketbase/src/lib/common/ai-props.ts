import { Property } from '@activepieces/pieces-framework';
import type { PropParams } from './props';

function collection<R extends boolean>({ required, displayName = 'Collection', description = 'Collection name or ID, e.g. "posts". Use List Collections to find it.' }: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function page<R extends boolean>({ required, displayName = 'Page', description = 'Page number, starting at 1. Defaults to 1.' }: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function perPage<R extends boolean>({ required, displayName = 'Per Page', description = 'Items per page (1-1000). Defaults to 30.' }: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function sort<R extends boolean>({ required, displayName = 'Sort', description = 'Comma separated fields to sort by; prefix with - for descending, e.g. "-created,name".' }: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function filter<R extends boolean>({ required, displayName = 'Filter', description = 'PocketBase filter expression, e.g. "created > \'2024-01-01\' && name ~ \'abc\'".' }: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

export const pocketbaseAiProps = { collection, page, perPage, sort, filter };

