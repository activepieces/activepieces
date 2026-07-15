import { describe, expect, it } from 'vitest';
import { identityHashing } from './hashing';

describe('identityHashing', () => {
  it('removes phone extensions before hashing', () => {
    expect(identityHashing.phone('+1 (555) 444-1234 ext. 789')).toBe(
      'e5b124c58580eb16bd959b8d0cac12b12c952e2ceae0203d416cff94f10b994a'
    );
  });

  it('uppercases IDFA values before hashing', () => {
    expect(identityHashing.idfa('ea7583cd-a667-48bc-b806-42ecb2b48606')).toBe(
      '70574fa9c8f498a7b2e5c8712b1126de7b1406fd02fdc591821c5bd33092fd1c'
    );
  });

  it('lowercases AAID values before hashing', () => {
    expect(identityHashing.aaid('CDDA802E-FB9C-47AD-9866-0794D394C912')).toBe(
      'f23b554b2a8fb732a8b973733832e70f018da7bc294dfea289735a07d5dd2c9f'
    );
  });

  it('passes through pre-hashed values in lowercase', () => {
    expect(identityHashing.email('A'.repeat(64))).toBe('a'.repeat(64));
  });

  // Reddit's official canonicalization example: alice@example.com and
  // Al.ice$+Apple@Example.Com must both hash to the same value.
  // https://business.reddithelp.com/s/article/advanced-matching-for-developers
  it('canonicalizes email per Reddit (lowercase, strip alias, strip non-alphanumeric)', () => {
    const expected =
      'ff8d9819fc0e12bf0d24892e45987e249a28dce836a85cad60e28eaaa8c6d976';
    expect(identityHashing.email('alice@example.com')).toBe(expected);
    expect(identityHashing.email('Al.ice$+Apple@Example.Com')).toBe(expected);
  });

  it('strips underscores and hyphens from the email local part', () => {
    expect(identityHashing.email('john_doe@company.com')).toBe(
      identityHashing.email('johndoe@company.com')
    );
    expect(identityHashing.email('mary-jane@company.com')).toBe(
      identityHashing.email('maryjane@company.com')
    );
  });
});
