import { QueryKey } from '@tanstack/react-query';

const lists: QueryKey[] = [['tables'], ['root-tables']];

function table(tableId: string | undefined): QueryKey {
  return ['table', tableId];
}

function fields(tableId: string | undefined): QueryKey {
  return ['fields', tableId];
}

function records(tableId: string | undefined): QueryKey {
  return ['records', tableId];
}

export const tableQueryKeys = {
  lists,
  table,
  fields,
  records,
};
