import { Property } from '@activepieces/pieces-framework';
import { totalcmsApi, totalcmsHelpers, TotalCmsConnection } from './client';
import { totalcmsShape } from './shape';
import { totalcmsUpdate } from './update';
import { totalcmsUpload } from './upload';

const MAX_LIMIT = 100;

export const totalcmsOperations = {
  findProps,
  findObjects,
  collectionFields,
  createFieldsProp,
  createObject,
  updateFieldsProp,
  updateObject,
  uploadExtraProps,
  uploadFile,
  adjustProps,
  adjustNumber,
  newIdProp,
  cloneObject,
};

function findProps() {
  return {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Words to search for in any field. Use "quotes" for an exact phrase and "or" between words to match any.',
      required: false,
    }),
    include: Property.ShortText({
      displayName: 'Only Include',
      description:
        'Keep only objects matching ALL of these filters, separated by commas. Examples: draft:false, featured, category:in:news|events, price:lte:100.',
      required: false,
    }),
    exclude: Property.ShortText({
      displayName: 'Exclude',
      description: 'Drop objects matching ANY of these filters, separated by commas. Example: draft:true.',
      required: false,
    }),
    sort: Property.ShortText({
      displayName: 'Sort By',
      description: 'A field name to sort by. Put - in front for newest or largest first, for example -created or -date.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: `How many objects to return (1-${MAX_LIMIT}).`,
      required: false,
      defaultValue: 20,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'How many matching objects to skip. Use Next Offset from a previous run to get the next page.',
      required: false,
      defaultValue: 0,
    }),
  };
}

async function findObjects({ auth, input }: { auth: TotalCmsConnection; input: FindInput }) {
  const collection = totalcmsShape.requireId({ value: input.collection, label: 'Collection' });
  const limit = wholeNumber({ value: input.limit, fallback: 20, label: 'Limit', min: 1, max: MAX_LIMIT });
  const offset = wholeNumber({ value: input.offset, fallback: 0, label: 'Offset', min: 0, max: Number.MAX_SAFE_INTEGER });
  const page = await totalcmsApi.queryObjects({
    auth,
    collection,
    limit,
    offset,
    sort: trimmed({ value: input.sort }),
    search: trimmed({ value: input.search }),
    include: trimmed({ value: input.include }),
    exclude: trimmed({ value: input.exclude }),
  });
  const hasMore = offset + page.objects.length < page.total;
  return {
    objects: page.objects,
    count: page.objects.length,
    total: page.total,
    offset,
    has_more: hasMore,
    next_offset: hasMore ? offset + page.objects.length : null,
  };
}

async function collectionFields({ auth, collection }: { auth: TotalCmsConnection; collection: unknown }) {
  const collectionId = totalcmsShape.requireId({ value: collection, label: 'Collection' });
  const schema = await totalcmsApi.getSchema({ auth, collection: collectionId });
  const required = stringList({ value: schema['required'] });
  const index = stringList({ value: schema['index'] });
  const properties = totalcmsHelpers.isRecord(schema['properties']) ? schema['properties'] : {};
  const fields = Object.entries(properties).map(([key, value]) => {
    const property = totalcmsHelpers.isRecord(value) ? value : {};
    return {
      key,
      label: typeof property['label'] === 'string' ? property['label'] : key,
      field_type: typeof property['field'] === 'string' ? property['field'] : null,
      data_type: typeof property['type'] === 'string' ? property['type'] : refName({ value: property['$ref'] }),
      required: required.includes(key),
      in_index: index.includes(key),
      help: typeof property['help'] === 'string' ? property['help'] : null,
    };
  });
  return {
    collection: collectionId,
    schema: typeof schema['id'] === 'string' ? schema['id'] : null,
    description: typeof schema['description'] === 'string' ? schema['description'] : null,
    fields,
  };
}

function createFieldsProp() {
  return Property.Json({
    displayName: 'Fields',
    description: 'The field values as JSON, for example {"title": "Hello", "draft": false}. Use Get Collection Fields to see the field names.',
    required: true,
    defaultValue: {},
  });
}

async function createObject({ auth, collection, objectId, fields }: { auth: TotalCmsConnection; collection: unknown; objectId: unknown; fields: unknown }) {
  const collectionId = totalcmsShape.requireId({ value: collection, label: 'Collection' });
  const parsed = totalcmsShape.parseFields({ value: fields, label: 'Fields' });
  const id = typeof objectId === 'string' ? objectId.trim() : '';
  const object = await totalcmsApi.createObject({ auth, collection: collectionId, fields: id ? { ...parsed, id } : parsed });
  return totalcmsShape.generic({ collection: collectionId, object });
}

function updateFieldsProp() {
  return Property.Json({
    displayName: 'Fields to Change',
    description: 'Only the fields to change, as JSON, for example {"title": "New title"}. Use Get Collection Fields to see the field names.',
    required: true,
    defaultValue: {},
  });
}

async function updateObject({ auth, collection, objectId, fields }: { auth: TotalCmsConnection; collection: unknown; objectId: unknown; fields: unknown }) {
  const collectionId = totalcmsShape.requireId({ value: collection, label: 'Collection' });
  const id = totalcmsShape.requireId({ value: objectId, label: 'Object ID' });
  return totalcmsUpdate.run({ auth, collection: collectionId, id, fields });
}

function uploadExtraProps() {
  return {
    ...totalcmsUpload.fileProps(),
    folder: Property.ShortText({
      displayName: 'Folder',
      description: 'Depot fields only: an optional folder path, such as 2026/reports.',
      required: false,
    }),
  };
}

async function uploadFile({ auth, input }: { auth: TotalCmsConnection; input: UploadInput }) {
  const collection = totalcmsShape.requireId({ value: input.collection, label: 'Collection' });
  const id = totalcmsShape.requireId({ value: input.object_id, label: 'Object ID' });
  const field = totalcmsShape.requireId({ value: input.field, label: 'Field' });
  const result = await totalcmsUpload.save({
    auth,
    collection,
    id,
    property: field,
    file: input.file,
    fileUrl: input.file_url,
    folder: typeof input.folder === 'string' ? input.folder : undefined,
    multiple: false,
  });
  return { ...totalcmsShape.generic({ collection, object: result.object }), field, preview_url: result.preview_url };
}

function adjustProps() {
  return {
    direction: Property.StaticDropdown({
      displayName: 'Change',
      required: true,
      defaultValue: 'increment',
      options: {
        options: [
          { label: 'Increase', value: 'increment' },
          { label: 'Decrease', value: 'decrement' },
        ],
      },
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'How much to add or subtract. Must be more than 0.',
      required: true,
      defaultValue: 1,
    }),
  };
}

async function adjustNumber({ auth, input }: { auth: TotalCmsConnection; input: AdjustInput }) {
  const collection = totalcmsShape.requireId({ value: input.collection, label: 'Collection' });
  const id = totalcmsShape.requireId({ value: input.object_id, label: 'Object ID' });
  const field = totalcmsShape.requireId({ value: input.field, label: 'Number Field' });
  const direction = input.direction === 'decrement' ? 'decrement' : input.direction === 'increment' ? 'increment' : null;
  if (!direction) {
    throw new Error('Change must be Increase or Decrease.');
  }
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Amount must be a number greater than 0.');
  }
  const result = await totalcmsApi.adjustNumber({ auth, collection, id, property: field, direction, amount });
  return { collection, id, field, value: typeof result['value'] === 'number' ? result['value'] : null };
}

function newIdProp() {
  return Property.ShortText({
    displayName: 'New Object ID',
    description: 'The ID (URL slug) for the copy, for example my-post-copy. Must not exist yet.',
    required: true,
  });
}

async function cloneObject({ auth, collection, objectId, newId }: { auth: TotalCmsConnection; collection: unknown; objectId: unknown; newId: unknown }) {
  const collectionId = totalcmsShape.requireId({ value: collection, label: 'Collection' });
  const id = totalcmsShape.requireId({ value: objectId, label: 'Object ID' });
  const target = totalcmsShape.requireId({ value: newId, label: 'New Object ID' });
  if (target === id) {
    throw new Error('New Object ID must be different from the object being copied.');
  }
  const object = await totalcmsApi.cloneObject({ auth, collection: collectionId, id, newId: target });
  return totalcmsShape.generic({ collection: collectionId, object });
}

function wholeNumber({ value, fallback, label, min, max }: { value: unknown; fallback: number; label: string; min: number; max: number }): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(max === Number.MAX_SAFE_INTEGER ? `${label} must be a whole number of ${min} or more.` : `${label} must be a whole number from ${min} to ${max}.`);
  }
  return number;
}

function trimmed({ value }: { value: unknown }): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function stringList({ value }: { value: unknown }): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function refName({ value }: { value: unknown }): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const last = value.split('/').pop() ?? '';
  return last.replace(/\.json$/, '') || null;
}

type FindInput = {
  collection: unknown;
  search?: unknown;
  include?: unknown;
  exclude?: unknown;
  sort?: unknown;
  limit?: unknown;
  offset?: unknown;
};

type UploadInput = { collection: unknown; object_id: unknown; field: unknown; file?: unknown; file_url?: unknown; folder?: unknown };

type AdjustInput = { collection: unknown; object_id: unknown; field: unknown; direction: unknown; amount: unknown };
