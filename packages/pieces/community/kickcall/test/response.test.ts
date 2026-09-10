/// <reference types="vitest/globals" />

import { kickcallResponse } from '../src/lib/common/response';

describe('collectionRows', () => {
  test('returns a top-level array payload', () => {
    expect(kickcallResponse.collectionRows([{ id: 1 }])).toEqual([{ id: 1 }]);
  });

  test('reads supported envelope keys in priority order', () => {
    expect(
      kickcallResponse.collectionRows({
        data: [{ id: 'from-data' }],
        locations: [{ id: 'from-locations' }],
      }),
    ).toEqual([{ id: 'from-data' }]);
    expect(
      kickcallResponse.collectionRows({
        locations: [{ id: 'loc' }],
      }),
    ).toEqual([{ id: 'loc' }]);
    expect(
      kickcallResponse.collectionRows({
        agents: [{ id: 'agent' }],
      }),
    ).toEqual([{ id: 'agent' }]);
    expect(
      kickcallResponse.collectionRows({
        items: [{ id: 'item' }],
      }),
    ).toEqual([{ id: 'item' }]);
    expect(
      kickcallResponse.collectionRows({
        results: [{ id: 'result' }],
      }),
    ).toEqual([{ id: 'result' }]);
  });

  test('returns an empty array for unsupported shapes', () => {
    expect(kickcallResponse.collectionRows(null)).toEqual([]);
    expect(kickcallResponse.collectionRows('x')).toEqual([]);
    expect(kickcallResponse.collectionRows({ meta: { total_pages: 1 } })).toEqual(
      [],
    );
  });
});

describe('totalPages', () => {
  test('reads numeric and string meta.total_pages', () => {
    expect(
      kickcallResponse.totalPages({ meta: { total_pages: 3 } }),
    ).toBe(3);
    expect(
      kickcallResponse.totalPages({ meta: { total_pages: '4' } }),
    ).toBe(4);
  });

  test('ignores invalid pagination metadata', () => {
    expect(kickcallResponse.totalPages({ meta: { total_pages: 0 } })).toBe(
      undefined,
    );
    expect(kickcallResponse.totalPages({ meta: { total_pages: 'nope' } })).toBe(
      undefined,
    );
    expect(kickcallResponse.totalPages({})).toBe(undefined);
  });
});

describe('namedOptionsFromCollection', () => {
  test('maps id and name variants used by Kickcall lists', () => {
    expect(
      kickcallResponse.namedOptionsFromCollection({
        data: [
          { id: 10, name: 'Clinic' },
          { location_id: 11, location_name: 'Downtown' },
          { agent_id: 12, agent_name: 'Alex' },
          { kickcall_agent_id: 13, label: 'Sam' },
        ],
      }),
    ).toEqual([
      { label: 'Clinic', value: '10' },
      { label: 'Downtown', value: '11' },
      { label: 'Alex', value: '12' },
      { label: 'Sam', value: '13' },
    ]);
  });
});

describe('requestedPerPage', () => {
  test('defaults to 100 and rejects invalid values', () => {
    expect(kickcallResponse.requestedPerPage(undefined)).toBe(100);
    expect(kickcallResponse.requestedPerPage({ per_page: '0' })).toBe(100);
    expect(kickcallResponse.requestedPerPage({ per_page: '25' })).toBe(25);
  });
});

describe('isLastCollectionPage', () => {
  test('stops when meta total pages is reached', () => {
    expect(
      kickcallResponse.isLastCollectionPage({
        page: 2,
        pageRowsLength: 100,
        perPage: 100,
        totalPagesFromMeta: 2,
      }),
    ).toBe(true);
    expect(
      kickcallResponse.isLastCollectionPage({
        page: 1,
        pageRowsLength: 100,
        perPage: 100,
        totalPagesFromMeta: 2,
      }),
    ).toBe(false);
  });

  test('without meta, a full page continues and a short or empty page stops', () => {
    expect(
      kickcallResponse.isLastCollectionPage({
        page: 1,
        pageRowsLength: 100,
        perPage: 100,
        totalPagesFromMeta: undefined,
      }),
    ).toBe(false);
    expect(
      kickcallResponse.isLastCollectionPage({
        page: 2,
        pageRowsLength: 40,
        perPage: 100,
        totalPagesFromMeta: undefined,
      }),
    ).toBe(true);
    expect(
      kickcallResponse.isLastCollectionPage({
        page: 3,
        pageRowsLength: 0,
        perPage: 100,
        totalPagesFromMeta: undefined,
      }),
    ).toBe(true);
  });
});
