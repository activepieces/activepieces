import { describe, expect, it } from 'vitest';
import { toImageReplacements } from './image-replacements';

describe('toImageReplacements', () => {
  it('maps the row editor array shape', () => {
    expect(
      toImageReplacements([
        { imageObjectId: 'kix.one', url: 'https://example.com/one.png' },
        { imageObjectId: 'kix.two', url: 'https://example.com/two.png' },
      ]),
    ).toEqual([
      { imageObjectId: 'kix.one', url: 'https://example.com/one.png' },
      { imageObjectId: 'kix.two', url: 'https://example.com/two.png' },
    ]);
  });

  it('maps the legacy dictionary after the engine wraps it in a one-element array', () => {
    expect(
      toImageReplacements([
        {
          'kix.one': 'https://example.com/one.png',
          'kix.two': 'https://example.com/two.png',
        },
      ]),
    ).toEqual([
      { imageObjectId: 'kix.one', url: 'https://example.com/one.png' },
      { imageObjectId: 'kix.two', url: 'https://example.com/two.png' },
    ]);
  });

  it('maps the bare legacy dictionary shape', () => {
    expect(
      toImageReplacements({
        'kix.one': 'https://example.com/one.png',
        'kix.two': 'https://example.com/two.png',
      }),
    ).toEqual([
      { imageObjectId: 'kix.one', url: 'https://example.com/one.png' },
      { imageObjectId: 'kix.two', url: 'https://example.com/two.png' },
    ]);
  });

  it('skips half-filled editor rows and non-object rows', () => {
    expect(
      toImageReplacements([
        { imageObjectId: 'kix.one' },
        { url: 'https://example.com/two.png' },
        'not-a-row',
        null,
        { imageObjectId: 'kix.three', url: 'https://example.com/three.png' },
      ]),
    ).toEqual([{ imageObjectId: 'kix.three', url: 'https://example.com/three.png' }]);
  });

  it('returns nothing when images are absent', () => {
    expect(toImageReplacements(undefined)).toEqual([]);
    expect(toImageReplacements(null)).toEqual([]);
    expect(toImageReplacements([])).toEqual([]);
    expect(toImageReplacements({})).toEqual([]);
    expect(toImageReplacements([{}])).toEqual([]);
  });
});
