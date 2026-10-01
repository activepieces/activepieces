import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  t: (key: string, options?: { count?: number }) =>
    key === 'itemCount'
      ? `${options?.count} items`
      : `${options?.count} fields`,
}));

import { previewObject } from './object-preview';

const prop = (type: string, payload: unknown) => ({
  id: '%3Bo%3A%5E',
  type,
  [type]: payload,
});

describe('previewObject — typed envelopes', () => {
  it('names the type once and shows the value (was "id: …, type: email")', () => {
    expect(previewObject(prop('email', 'kitchen@example.com'))).toBe(
      'email: kitchen@example.com',
    );
  });

  it('counts arrays instead of hiding them behind an ellipsis', () => {
    expect(previewObject(prop('files', [{ name: 'a' }, { name: 'b' }]))).toBe(
      'files: 2 items',
    );
  });

  it('keeps falsy scalars that are real values', () => {
    expect(previewObject(prop('number', 0))).toBe('number: 0');
    expect(previewObject(prop('checkbox', false))).toBe('checkbox: false');
  });

  it('drills one level into a wrapper object via its display key', () => {
    expect(
      previewObject(prop('select', { id: 'o1', name: 'Doing', color: 'blue' })),
    ).toBe('select: Doing');
    expect(
      previewObject(prop('date', { start: '2026-09-10', end: null })),
    ).toBe('date: 2026-09-10');
  });

  it('unwraps a nested envelope (formula, rollup)', () => {
    expect(previewObject(prop('formula', { type: 'number', number: 84 }))).toBe(
      'formula: 84',
    );
    expect(
      previewObject(
        prop('rollup', {
          type: 'array',
          function: 'show_original',
          array: [1, 2],
        }),
      ),
    ).toBe('rollup: 2 items');
  });

  it('falls back to the wrapper display key when the inner envelope is empty', () => {
    expect(
      previewObject(
        prop('created_by', {
          object: 'user',
          id: 'b1',
          name: 'Activepieces',
          type: 'bot',
          bot: {},
        }),
      ),
    ).toBe('created_by: Activepieces');
  });

  it('falls back to a placeholder when the payload has no short form', () => {
    expect(previewObject(prop('select', null))).toBe('select: …');
    expect(previewObject(prop('button', {}))).toBe('button: …');
  });

  it('ignores a type that names nothing, or names itself', () => {
    expect(previewObject({ type: 'message', text: 'hi', user: 'U1' })).toBe(
      'type: message, text: hi',
    );
    expect(previewObject({ type: 'type' })).toBe('type: type');
  });
});

describe('previewObject — plain objects', () => {
  it('moves identifier keys behind meaningful ones', () => {
    expect(
      previewObject({ id: 'rec1', createdTime: '2026-01-01', name: 'Row' }),
    ).toBe('createdTime: 2026-01-01, name: Row');
  });

  it('treats *_id, *Id and uuid as identifiers, but not words ending in id', () => {
    expect(previewObject({ database_id: 'd', userId: 'u', paid: true })).toBe(
      'paid: true, database_id: d',
    );
  });

  it('still shows identifiers when the object has nothing else', () => {
    expect(previewObject({ object: 'user', id: 'u1' })).toBe(
      'object: user, id: u1',
    );
  });

  it('counts fields when every entry is empty, and handles {}', () => {
    expect(previewObject({})).toBe('0 fields');
    expect(previewObject({ a: null, b: '' })).toBe('a: …, b: …');
  });
});
