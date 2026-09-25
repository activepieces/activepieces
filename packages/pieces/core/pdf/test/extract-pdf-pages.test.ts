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

  test('should accept negative start equal to the total page count', () => {
    const indexes = pageRangeToIndexes(-10, -10, 10);
    expect(indexes).toStrictEqual([0]);
  });

  test('should map the full negative range to every page', () => {
    const indexes = pageRangeToIndexes(-3, -1, 3);
    expect(indexes).toStrictEqual([0, 1, 2]);
  });

  test('should throw error if negative start is beyond the total pages', () => {
    expect(() => {
      pageRangeToIndexes(-15, -1, 10);
    }).toThrow();
  });

  test('should throw error if negative end is beyond the total pages', () => {
    expect(() => {
      pageRangeToIndexes(-15, -12, 10);
    }).toThrow();
  });
});
