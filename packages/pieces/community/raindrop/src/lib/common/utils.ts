import type { RaindropFlatItem, RaindropItem } from './types';

function flattenRaindrop({ raindrop }: { raindrop: RaindropItem }): RaindropFlatItem {
  return {
    id: raindrop._id,
    title: raindrop.title ?? null,
    excerpt: raindrop.excerpt ?? null,
    note: raindrop.note ?? null,
    link: raindrop.link ?? null,
    type: raindrop.type ?? null,
    tags: Array.isArray(raindrop.tags) ? raindrop.tags.join(', ') : null,
    important: raindrop.important ?? false,
    collection_id: raindrop.collection?.$id ?? null,
    cover: raindrop.cover ?? null,
    created_at: raindrop.created ?? null,
    updated_at: raindrop.lastUpdate ?? null,
  };
}

function toBoolean({ value }: { value: string | undefined }): boolean | undefined {
  return value === undefined ? undefined : value === 'true';
}

function toStringList({ value }: { value: unknown[] | undefined }): string[] {
  return (value ?? []).map((item) => String(item));
}

export const raindropUtils = { flattenRaindrop, toBoolean, toStringList };
