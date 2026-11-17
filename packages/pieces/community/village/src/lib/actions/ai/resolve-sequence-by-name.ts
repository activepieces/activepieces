import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const resolveSequenceByName = createAction({
  auth: villageAuth,
  name: 'resolve_sequence_by_name',
  classification: 'READ',
  displayName: 'Resolve Sequence by Name',
  description: 'Find the ID of one of your Village sequences by its name. Free.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Turns a sequence name into its sequence ID (case-insensitive exact match over every sequence whose name contains the name). found=false with other_matches listing partial matches when there is no exact match. Free, read-only.',
    idempotent: true,
  },
  outputSchema: villageSchemas.aiResolveByName,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
  },
  async run(context) {
    const name = villageApi.requireText({ value: context.propsValue.name, field: 'Name' });
    const items = await collectPages<{ id: number | string; name?: string }>({
      fetchPage: async (cursor) => {
        const response = await villageApi.call<PageResponse<{ id: number | string; name?: string }>>({
          token: context.auth.secret_text,
          method: HttpMethod.GET,
          path: '/v2/sequences',
          queryParams: { search: name, limit: '100', cursor },
        });
        return response;
      },
    });
    return villageApi.matchByName({
      items: items.map((sequence) => ({ id: String(sequence.id), name: sequence.name ?? '' })),
      name,
    });
  },
});

async function collectPages<T>({
  fetchPage,
}: {
  fetchPage: (cursor: string | undefined) => Promise<PageResponse<T>>;
}): Promise<T[]> {
  let cursor: string | undefined = undefined;
  let items: T[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const response = await fetchPage(cursor);
    items = [...items, ...(response.data ?? [])];
    const next = response.pagination?.cursor;
    if (!response.pagination?.has_next_page || next === undefined || next === null || String(next) === '') {
      return items;
    }
    cursor = String(next);
  }
  throw new Error('Too many sequences match this name; use a more specific name.');
}

const MAX_PAGES = 20;

type PageResponse<T> = {
  data?: T[];
  pagination?: { cursor?: string | number | null; has_next_page?: boolean };
};
