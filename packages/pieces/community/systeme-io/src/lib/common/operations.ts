import { HttpMethod } from '@activepieces/pieces-common';
import { apiErrorStatus, SystemeContact, SystemeTag, systemeIoCommon, systemeIoInput } from './client';
import { tagRow } from './mappers';

const TAG_NAME_MAX = 64;

async function deleteById({ apiKey, url, id }: { apiKey: string; url: string; id: number }) {
  try {
    await systemeIoCommon.apiCall({ method: HttpMethod.DELETE, url, auth: apiKey });
    return { deleted: true, not_found: false, id };
  } catch (error) {
    if (apiErrorStatus(error) === 404) {
      return { deleted: false, not_found: true, id };
    }
    throw error;
  }
}

function validTagName(name: unknown): string {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (trimmed === '') {
    throw new Error('Tag name is required.');
  }
  if (trimmed.length > TAG_NAME_MAX) {
    throw new Error(`Tag name must be at most ${TAG_NAME_MAX} characters (got ${trimmed.length}).`);
  }
  return trimmed;
}

async function findTagByName({ apiKey, name }: { apiKey: string; name: string }): Promise<SystemeTag | undefined> {
  const wanted = name.toLowerCase();
  const { items, hasMore } = await systemeIoCommon.getTags({ auth: apiKey, query: name });
  const match = items.find((tag) => typeof tag.name === 'string' && tag.name.trim().toLowerCase() === wanted);
  if (!match && hasMore) {
    throw new Error(`More than 1,000 tags contain "${name}", so an existing tag with that exact name could not be ruled out. No tag was created.`);
  }
  return match;
}

async function getOrCreateTag({ apiKey, name }: { apiKey: string; name: unknown }) {
  const tagName = validTagName(name);
  const existing = await findTagByName({ apiKey, name: tagName });
  if (existing) {
    return { ...tagRow(existing), created: false };
  }
  const created = await systemeIoCommon.apiCall<SystemeTag>({
    method: HttpMethod.POST,
    url: '/tags',
    body: { name: tagName },
    auth: apiKey,
  });
  return { ...tagRow(created), created: true };
}

async function removeMatching<T extends { id?: unknown }>({
  apiKey,
  listUrl,
  query,
  matches,
  deleteUrl,
}: {
  apiKey: string;
  listUrl: string;
  query: Record<string, string | number>;
  matches: (row: T) => boolean;
  deleteUrl: (id: number) => string;
}) {
  const { items, hasMore } = await systemeIoCommon.paginate<T>({ auth: apiKey, url: listUrl, query, maxItems: 1000 });
  if (hasMore) {
    throw new Error('Systeme.io returned more than 1,000 matching rows, so the removal could not be checked completely. Nothing was removed.');
  }
  const ids = items
    .filter(matches)
    .map((row) => Number(row.id))
    .filter((id) => Number.isInteger(id) && id > 0);
  const results = [];
  for (const id of ids) {
    try {
      results.push(await deleteById({ apiKey, url: deleteUrl(id), id }));
    } catch (error) {
      const done = results.filter((r) => r.deleted).map((r) => r.id);
      if (done.length === 0) {
        throw error;
      }
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(`Removed ${done.join(', ')}, then removing ${id} failed: ${reason}`);
    }
  }
  const removedIds = results.filter((r) => r.deleted).map((r) => r.id);
  return {
    removed: removedIds.length > 0,
    removed_count: removedIds.length,
    removed_ids: removedIds,
    not_found: removedIds.length === 0,
  };
}

async function tagIsOnContact({ apiKey, contactId, tagId }: { apiKey: string; contactId: number; tagId: number }): Promise<boolean> {
  const contact = await systemeIoCommon.apiCall<SystemeContact>({
    method: HttpMethod.GET,
    url: `/contacts/${systemeIoInput.requireId({ value: contactId, name: 'Contact ID' })}`,
    auth: apiKey,
  });
  return (contact.tags ?? []).some((tag) => Number(tag.id) === tagId);
}

export const systemeOps = { deleteById, getOrCreateTag, validTagName, removeMatching, tagIsOnContact };
