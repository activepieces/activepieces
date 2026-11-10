import { describe, expect, it } from 'vitest';
import { slidesIds } from '../src/lib/commons/ids';

const ID = '1uZH8nHgfKRCkQNbLxdEwNnT9b2eIinM4igBaMT9RWlc';

describe('parsePresentationId', () => {
  it.each([
    [ID],
    [`https://docs.google.com/presentation/d/${ID}/edit`],
    [`https://docs.google.com/presentation/d/${ID}/edit#slide=id.p`],
    [`https://docs.google.com/presentation/u/1/d/${ID}/edit?usp=sharing`],
    [`https://docs.google.com/presentation/d/${ID}`],
    [`https://drive.google.com/file/d/${ID}/view`],
    [`https://drive.google.com/open?id=${ID}`],
    [`  ${ID}  `],
  ])('reads %s', (input) => {
    expect(slidesIds.parsePresentationId(input)).toBe(ID);
  });

  it('rejects published-to-web links with a specific message', () => {
    expect(() => slidesIds.parsePresentationId('https://docs.google.com/presentation/d/e/2PACX-1vabc/pub')).toThrow(
      /Publish to the web/
    );
  });

  it.each([
    [''],
    [undefined],
    ['short'],
    ['../../etc/passwd'],
    [`${ID}/../x`],
    [`https://docs.google.com.evil.io/presentation/d/${ID}/edit`],
    [`https://evil.io/presentation/d/${ID}/edit`],
    [`https://docs.google.com/document/d/${ID}/edit`],
  ])('rejects %s', (input) => {
    expect(() => slidesIds.parsePresentationId(input)).toThrow();
  });
});

describe('parseObjectId', () => {
  it('reads bare IDs including the 1-character default slide ID', () => {
    expect(slidesIds.parseObjectId('p')).toBe('p');
    expect(slidesIds.parseObjectId('g2c8d1e5a7f_0_12')).toBe('g2c8d1e5a7f_0_12');
    expect(slidesIds.parseObjectId('SLIDES_API1:x-y')).toBe('SLIDES_API1:x-y');
  });

  it('reads the slide ID from a slide URL', () => {
    expect(slidesIds.parseObjectId(`https://docs.google.com/presentation/d/${ID}/edit#slide=id.g12_0_3`)).toBe('g12_0_3');
  });

  it.each([['bad id!'], ['a/b'], [`https://docs.google.com/presentation/d/${ID}/edit`], ['https://evil.io/x#slide=id.p']])(
    'rejects %s',
    (input) => {
      expect(() => slidesIds.parseObjectId(input)).toThrow();
    }
  );
});

describe('parseFolderId', () => {
  it('returns undefined for empty input', () => {
    expect(slidesIds.parseFolderId('')).toBeUndefined();
    expect(slidesIds.parseFolderId(undefined)).toBeUndefined();
  });

  it('reads bare IDs and folder URLs', () => {
    expect(slidesIds.parseFolderId('0AITOlPXvClRfUk9PVA')).toBe('0AITOlPXvClRfUk9PVA');
    expect(slidesIds.parseFolderId('https://drive.google.com/drive/folders/0AITOlPXvClRfUk9PVA')).toBe('0AITOlPXvClRfUk9PVA');
    expect(slidesIds.parseFolderId('https://drive.google.com/drive/u/0/folders/abc_DEF-123?usp=sharing')).toBe('abc_DEF-123');
  });

  it("rejects values that could break out of the Drive query", () => {
    expect(() => slidesIds.parseFolderId("x' or name contains '")).toThrow();
  });
});

describe('generateObjectId', () => {
  it('follows the Slides object ID rule (5-50 chars, [a-zA-Z0-9_] first)', () => {
    const id = slidesIds.generateObjectId('slide');
    expect(id).toMatch(/^[a-zA-Z0-9_][a-zA-Z0-9_\-:]{4,49}$/);
    expect(slidesIds.generateObjectId('image')).not.toBe(slidesIds.generateObjectId('image'));
  });
});

describe('validateImageUrl', () => {
  it('accepts http(s) URLs and rejects others', () => {
    expect(slidesIds.validateImageUrl(' https://cdn.example.com/a.png ')).toBe('https://cdn.example.com/a.png');
    expect(() => slidesIds.validateImageUrl('ftp://x/y.png')).toThrow();
    expect(() => slidesIds.validateImageUrl('not a url')).toThrow();
    expect(() => slidesIds.validateImageUrl(`https://x.io/${'a'.repeat(2100)}`)).toThrow(/2 KB/);
  });
});
