import { Property } from '@activepieces/pieces-framework';

function collection<R extends boolean>({ required, displayName = 'Collection Name', description = 'The name of the PocketBase collection' }: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function sort<R extends boolean>({ required, displayName = 'Sort', description = 'Order attribute(s). Use - for DESC, + for ASC. E.g.: -created,id' }: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function filter<R extends boolean>({ required, displayName = 'Filter', description = "Filter expression. E.g.: (id='abc' && created>'2022-01-01')" }: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function expand<R extends boolean>({ required, displayName = 'Expand', description = 'Auto expand relations. E.g.: relField1,relField2.subRelField' }: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function fields<R extends boolean>({ required, displayName = 'Fields', description = 'Comma separated fields to return. E.g.: *,expand.relField.name' }: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

export const pocketbaseProps = { collection, sort, filter, expand, fields };

export type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
