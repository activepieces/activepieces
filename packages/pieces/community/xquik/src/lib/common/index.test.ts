import { describe, expect, it } from 'vitest';
import { xquikCommon } from './index';

describe('xquikCommon.utils', () => {
  it('removes empty query values and stringifies primitives', () => {
    expect.assertions(1);

    expect(
      xquikCommon.utils.cleanQueryParams({
        count: 30,
        cursor: undefined,
        includeReplies: false,
        maxId: null,
        q: 'AI',
        sinceTime: '',
      })
    ).toStrictEqual({
      count: '30',
      includeReplies: 'false',
      q: 'AI',
    });
  });

  it('strips an @ prefix from usernames', () => {
    expect.assertions(2);

    expect(xquikCommon.utils.stripAtPrefix('@xquik')).toBe('xquik');
    expect(xquikCommon.utils.stripAtPrefix('xquik')).toBe('xquik');
  });

  it('encodes path segments', () => {
    expect.assertions(1);

    expect(xquikCommon.utils.encodePathPart('hello/world')).toBe(
      'hello%2Fworld'
    );
  });
});
