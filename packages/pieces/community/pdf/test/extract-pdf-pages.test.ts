import { pageRangeToIndexes } from './../src/lib/actions/extract-pdf-pages';

describe('pageRangeToIndexes', () => {
  test('should throw error if start more than end', () => {
    expect(() => {
      pageRangeToIndexes(5, 3, 10);
    }).toThrow();
  });

  test('should throw error on start 0', () => {
    expect(() => {
      pageRangeToIndexes(0, 10, 10);
    }).toThrow();
  });

  test('should throw error on end 0', () => {
    expect(() => {
      pageRangeToIndexes(0, 10, 10);
    }).toThrow();
  });

  test('should throw error if start more than total pages', () => {
    expect(() => {
      pageRangeToIndexes(10, 10, 5);
    }).toThrow();
  });

  test('should throw error if end more than total pages', () => {
    expect(() => {
      pageRangeToIndexes(1, 11, 5);
    }).toThrow();
  });

  test('should throw error start negative when end positive', () => {
    expect(() => {
      pageRangeToIndexes(-1, 4, 10);
    }).toThrow();
  });

  test('should succeed with positive range', () => {
    const indexes = pageRangeToIndexes(1, 4, 10);
    expect(indexes).toStrictEqual([0, 1, 2, 3]);
  });

  test('should succeed with positive range of 1 value', () => {
    const indexes = pageRangeToIndexes(5, 5, 10);
    expect(indexes).toStrictEqual([4]);
  });

  test('should succeed with negative range', () => {
    const indexes = pageRangeToIndexes(-4, -1, 10);
    expect(indexes).toStrictEqual([6, 7, 8, 9]);
  });

  test('should succeed with negative range of 1 value', () => {
    const indexes = pageRangeToIndexes(-5, -5, 10);
    expect(indexes).toStrictEqual([5]);
  });
});
