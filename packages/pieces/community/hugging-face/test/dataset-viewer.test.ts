import { afterEach, describe, expect, it, vi } from 'vitest';
import { filterDatasetRows } from '../src/lib/actions/filter-dataset-rows';
import { getDatasetRows } from '../src/lib/actions/get-dataset-rows';
import { previewDatasetRows } from '../src/lib/actions/preview-dataset-rows';
import { searchDatasetRows } from '../src/lib/actions/search-dataset-rows';
import { hfViewer } from '../src/lib/common/dataset-viewer';
import { runAction } from './helpers';

function rowsOf(count: number) {
  return Array.from({ length: count }, (_, index) => ({ row_idx: index, row: { text: `row ${index}` }, truncated_cells: [] }));
}

function stubViewer(body: unknown) {
  return vi.spyOn(hfViewer, 'request').mockResolvedValue(body);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('withPaging', () => {
  it('returns the next offset while more rows remain', () => {
    const result = hfViewer.withPaging({ body: { rows: rowsOf(3), num_rows_total: 10 }, offset: 0 });
    expect(result).toMatchObject({ count: 3, offset: 0, next_offset: 3, num_rows_total: 10, partial: false });
  });

  it('returns a null next offset on the last page', () => {
    const result = hfViewer.withPaging({ body: { rows: rowsOf(2), num_rows_total: 10 }, offset: 8 });
    expect(result).toMatchObject({ count: 2, next_offset: null });
  });

  it('returns a null next offset when the page ends exactly at the total', () => {
    const result = hfViewer.withPaging({ body: { rows: rowsOf(5), num_rows_total: 10 }, offset: 5 });
    expect(result['next_offset']).toBeNull();
  });

  it('returns a null next offset for an empty page', () => {
    const result = hfViewer.withPaging({ body: { rows: [], num_rows_total: 10 }, offset: 10 });
    expect(result).toMatchObject({ count: 0, next_offset: null });
  });

  it('keeps paging when the viewer reports no total', () => {
    const result = hfViewer.withPaging({ body: { rows: rowsOf(4) }, offset: 20 });
    expect(result).toMatchObject({ num_rows_total: null, next_offset: 24 });
  });

  it('passes the partial flag through', () => {
    const result = hfViewer.withPaging({ body: { rows: rowsOf(1), num_rows_total: 5, partial: true }, offset: 0 });
    expect(result['partial']).toBe(true);
  });

  it('treats a malformed body as an empty page', () => {
    const result = hfViewer.withPaging({ body: 'not json', offset: 0 });
    expect(result).toMatchObject({ rows: [], count: 0, next_offset: null, num_rows_total: null });
  });
});

describe('validatePaging', () => {
  it('defaults the offset to 0 and the length to 20', () => {
    expect(hfViewer.validatePaging({ offset: undefined, length: undefined })).toEqual({ offset: 0, length: 20 });
  });

  it('accepts the 100-row maximum', () => {
    expect(hfViewer.validatePaging({ offset: 40, length: 100 })).toEqual({ offset: 40, length: 100 });
  });

  it('rejects more than 100 rows per call', () => {
    expect(() => hfViewer.validatePaging({ offset: 0, length: 101 })).toThrow();
  });

  it('rejects a negative offset', () => {
    expect(() => hfViewer.validatePaging({ offset: -1, length: 10 })).toThrow();
  });
});

describe('row actions', () => {
  it('get_dataset_rows sends offset and length and pages from them', async () => {
    const request = stubViewer({ rows: rowsOf(2), num_rows_total: 6 });
    const result = await runAction({
      action: getDatasetRows,
      propsValue: { dataset: 'stanfordnlp/imdb', config: 'plain_text', split: 'train', offset: 2, length: 2 },
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/rows',
        query: [
          ['config', 'plain_text'],
          ['split', 'train'],
          ['offset', 2],
          ['length', 2],
        ],
      })
    );
    expect(result).toMatchObject({ offset: 2, count: 2, next_offset: 4 });
  });

  it('search_dataset_rows pages over the matches', async () => {
    const request = stubViewer({ rows: rowsOf(3), num_rows_total: 3 });
    const result = await runAction({
      action: searchDatasetRows,
      propsValue: { dataset: 'stanfordnlp/imdb', config: 'plain_text', split: 'train', query: 'wonderful', offset: 0, length: 3 },
    });
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ path: '/search' }));
    expect(result).toMatchObject({ count: 3, num_rows_total: 3, next_offset: null });
  });

  it('filter_dataset_rows pages over the filtered rows', async () => {
    const request = stubViewer({ rows: rowsOf(2), num_rows_total: 50 });
    const result = await runAction({
      action: filterDatasetRows,
      propsValue: {
        dataset: 'nyu-mll/glue',
        config: 'cola',
        split: 'train',
        where: '"label"=1',
        orderby: undefined,
        offset: 10,
        length: 2,
      },
    });
    expect(request).toHaveBeenCalledWith(expect.objectContaining({ path: '/filter' }));
    expect(result).toMatchObject({ offset: 10, next_offset: 12 });
  });
});

describe('preview_dataset_rows', () => {
  it('marks the preview truncated when Max Rows trims it', async () => {
    stubViewer({ rows: rowsOf(10), truncated: false, features: [] });
    const result = await runAction({
      action: previewDatasetRows,
      propsValue: { dataset: 'stanfordnlp/imdb', config: 'plain_text', split: 'train', max_rows: 3 },
    });
    expect(result).toMatchObject({ count: 3, rows_available: 10, truncated: true });
  });

  it('keeps truncated false when every preview row is returned', async () => {
    stubViewer({ rows: rowsOf(3), truncated: false, features: [] });
    const result = await runAction({
      action: previewDatasetRows,
      propsValue: { dataset: 'stanfordnlp/imdb', config: 'plain_text', split: 'train', max_rows: 20 },
    });
    expect(result).toMatchObject({ count: 3, rows_available: 3, truncated: false });
  });

  it('keeps the viewer truncated flag when the viewer preview is partial', async () => {
    stubViewer({ rows: rowsOf(5), truncated: true, features: [] });
    const result = await runAction({
      action: previewDatasetRows,
      propsValue: { dataset: 'stanfordnlp/imdb', config: 'plain_text', split: 'train', max_rows: 20 },
    });
    expect(result).toMatchObject({ count: 5, truncated: true });
  });
});
