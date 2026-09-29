import { OdooClient, OdooFieldMap } from './client';
import { Domain, odooOutput } from './values';

async function resolveFields({
  client,
  model,
  fields,
}: {
  client: OdooClient;
  model: string;
  fields?: readonly string[];
}): Promise<{ names: string[]; map: OdooFieldMap }> {
  const map = await client.fieldsGet(model);
  if (fields && fields.length > 0) {
    const unknown = fields.filter((name) => name !== 'id' && !(name in map));
    if (unknown.length > 0) {
      throw new Error(
        `Unknown field(s) on ${model}: ${unknown.join(', ')}. Use Get Model Fields to see the field names of this Odoo version.`,
      );
    }
    return { names: withId(fields), map };
  }
  const names = Object.entries(map)
    .filter(([, info]) => info.type !== 'binary')
    .map(([name]) => name);
  return { names: withId(names), map };
}

async function resolveKnownFields({
  client,
  model,
  wanted,
}: {
  client: OdooClient;
  model: string;
  wanted: readonly string[];
}): Promise<{ names: string[]; map: OdooFieldMap }> {
  const map = await client.fieldsGet(model);
  return { names: withId(wanted.filter((name) => name === 'id' || name in map)), map };
}

function withId(names: readonly string[]): string[] {
  return names.includes('id') ? [...names] : ['id', ...names];
}

async function searchPage({
  client,
  model,
  domain,
  fields,
  map,
  limit,
  offset,
  order,
  context,
}: SearchPageParams): Promise<SearchPageResult> {
  const rows = await client.call<Record<string, unknown>[]>({
    model,
    method: 'search_read',
    args: [domain],
    kwargs: {
      fields,
      offset,
      limit: limit + 1,
      order,
      context,
    },
  });
  const list = Array.isArray(rows) ? rows : [];
  const hasMore = list.length > limit;
  const page = hasMore ? list.slice(0, limit) : list;
  return {
    records: page.map((record) => odooOutput.normalizeRecord({ record, fields: map, requested: fields })),
    has_more: hasMore,
    next_offset: hasMore ? offset + limit : null,
  };
}

async function readByIds({
  client,
  model,
  ids,
  fields,
  map,
}: {
  client: OdooClient;
  model: string;
  ids: number[];
  fields: string[];
  map: OdooFieldMap;
}): Promise<Record<string, unknown>[]> {
  const rows = await client.call<Record<string, unknown>[]>({
    model,
    method: 'read',
    args: [ids],
    kwargs: { fields },
  });
  const list = Array.isArray(rows) ? rows : [];
  return list.map((record) => odooOutput.normalizeRecord({ record, fields: map, requested: fields }));
}

async function readOne({
  client,
  model,
  id,
  wanted,
}: {
  client: OdooClient;
  model: string;
  id: number;
  wanted: readonly string[];
}): Promise<Record<string, unknown>> {
  const { names, map } = await resolveKnownFields({ client, model, wanted });
  const [record] = await readByIds({ client, model, ids: [id], fields: names, map });
  if (!record) throw new Error(`${model} record ${id} was not found.`);
  return fillMissing({ record, wanted });
}

function fillMissing({ record, wanted }: { record: Record<string, unknown>; wanted: readonly string[] }): Record<string, unknown> {
  const ordered = wanted.flatMap((name): [string, unknown][] => {
    const own: [string, unknown] = [name, name in record ? record[name] : null];
    const label = `${name}_name`;
    return label in record ? [own, [label, record[label]]] : [own];
  });
  const placed = new Set(ordered.map(([key]) => key));
  return Object.fromEntries([...ordered, ...Object.entries(record).filter(([key]) => !placed.has(key))]);
}

async function findApp({
  client,
  model,
  wanted,
  domain,
  limit,
  offset,
  order,
  context,
  manyToOne,
}: {
  client: OdooClient;
  model: string;
  wanted: readonly string[];
  domain: Domain;
  limit: number;
  offset: number;
  order?: string;
  context?: Record<string, unknown>;
  manyToOne?: readonly string[];
}): Promise<{ model: string; count: number; offset: number; limit: number; has_more: boolean; next_offset: number | null; records: Record<string, unknown>[] }> {
  const { names, map } = await resolveKnownFields({ client, model, wanted });
  const page = await searchPage({ client, model, domain, fields: names, map, limit, offset, order, context });
  const records = page.records.map((record) => fillMissing({ record: fillManyToOne({ record, manyToOne }), wanted }));
  return { model, count: records.length, offset, limit, has_more: page.has_more, next_offset: page.next_offset, records };
}

function fillManyToOne({ record, manyToOne }: { record: Record<string, unknown>; manyToOne?: readonly string[] }): Record<string, unknown> {
  if (!manyToOne) return record;
  const missing = manyToOne.filter((name) => !(`${name}_name` in record));
  return { ...record, ...Object.fromEntries(missing.map((name) => [`${name}_name`, null])) };
}

async function readApp({
  client,
  model,
  id,
  wanted,
  manyToOne,
}: {
  client: OdooClient;
  model: string;
  id: number;
  wanted: readonly string[];
  manyToOne?: readonly string[];
}): Promise<Record<string, unknown>> {
  const record = await readOne({ client, model, id, wanted });
  return fillMissing({ record: fillManyToOne({ record, manyToOne }), wanted });
}

async function readCreated({
  client,
  model,
  id,
  label,
  wanted,
  manyToOne,
}: {
  client: OdooClient;
  model: string;
  id: number;
  label: string;
  wanted: readonly string[];
  manyToOne?: readonly string[];
}): Promise<Record<string, unknown>> {
  try {
    return await readApp({ client, model, id, wanted, manyToOne });
  } catch (error) {
    throw createdButUnread({ label, model, id, error });
  }
}

function createdButUnread({ label, model, id, error }: { label: string; model: string; id: number; error: unknown }): Error {
  const reason = (error instanceof Error ? error.message : String(error)).trim().replace(/\.+$/, '');
  return new Error(`${label} ${id} (${model}) was created, but reading it back failed: ${reason}. Do not retry the create; use Get Records with id ${id}.`);
}

export const odooRecords = {
  resolveFields,
  resolveKnownFields,
  searchPage,
  readByIds,
  readOne,
  findApp,
  readApp,
  readCreated,
  createdButUnread,
};

type SearchPageParams = {
  client: OdooClient;
  model: string;
  domain: Domain;
  fields: string[];
  map: OdooFieldMap;
  limit: number;
  offset: number;
  order?: string;
  context?: Record<string, unknown>;
};

type SearchPageResult = {
  records: Record<string, unknown>[];
  has_more: boolean;
  next_offset: number | null;
};
