import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { buildMemberBatches, identifiersFor, normalizeEmail, normalizeName, normalizePhone, sha256, toMemberInput } from '../../../src/lib/common/customer-match';

const hash = (s: string) => createHash('sha256').update(s).digest('hex');

describe('normalizeEmail()', () => {
  it('should trim, lowercase and drop Gmail dots', () => {
    expect(normalizeEmail('  John.Doe@Gmail.com ')).toBe('johndoe@gmail.com');
    expect(normalizeEmail('john.doe@googlemail.com')).toBe('johndoe@googlemail.com');
    expect(normalizeEmail('John.Doe@Example.com')).toBe('john.doe@example.com');
  });

  it('should reject values without an @', () => {
    expect(() => normalizeEmail('nope')).toThrow('not an e-mail address');
  });
});

describe('normalizePhone()', () => {
  it('should keep digits only and prefix +', () => {
    expect(normalizePhone('+55 (11) 99999-9999')).toBe('+5511999999999');
    expect(normalizePhone('5511999999999')).toBe('+5511999999999');
  });

  it('should reject short values', () => {
    expect(() => normalizePhone('123')).toThrow('E.164');
  });
});

describe('normalizeName()', () => {
  it('should lowercase, drop punctuation and collapse whitespace, keeping accents', () => {
    expect(normalizeName("  O'Brien ")).toBe('obrien');
    expect(normalizeName('Maria  José')).toBe('maria josé');
    expect(normalizeName('Dr. Ana-Luísa')).toBe('dr analuísa');
  });
});

describe('identifiersFor()', () => {
  it('should hash each identifier the member provides in the Data Manager shape', () => {
    expect(
      identifiersFor({ email: 'A.B@gmail.com', phone: '+55 (11) 99999-9999', firstName: ' Ana ', lastName: 'Souza', countryCode: 'br', postalCode: ' 01310-100 ' })
    ).toEqual([
      { emailAddress: hash('ab@gmail.com') },
      { phoneNumber: hash('+5511999999999') },
      { address: { givenName: hash('ana'), familyName: hash('souza'), regionCode: 'BR', postalCode: '01310-100' } },
    ]);
  });

  it('should require the full address set when any address field is given', () => {
    expect(() => identifiersFor({ firstName: 'Ana' })).toThrow('missing: lastName, countryCode, postalCode');
  });

  it('should return nothing for an empty member', () => {
    expect(identifiersFor({})).toEqual([]);
    expect(sha256('x')).toBe(hash('x'));
  });
});

describe('buildMemberBatches()', () => {
  it('should build one audience member per input member', () => {
    const { batches, identifiers } = buildMemberBatches({ members: [{ email: 'a@x.com' }, { phone: '+5511999999999', email: 'b@x.com' }], limit: 10 });

    expect(identifiers).toBe(3);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toEqual([
      { userData: { userIdentifiers: [{ emailAddress: hash('a@x.com') }] } },
      { userData: { userIdentifiers: [{ emailAddress: hash('b@x.com') }, { phoneNumber: hash('+5511999999999') }] } },
    ]);
  });

  it('should split batches by the member limit', () => {
    const members = Array.from({ length: 5 }, (_, i) => ({ email: `u${i}@x.com` }));

    const { batches, identifiers } = buildMemberBatches({ members, limit: 2 });

    expect(identifiers).toBe(5);
    expect(batches.map((b) => b.length)).toEqual([2, 2, 1]);
    expect(batches[2]?.[0]).toEqual({ userData: { userIdentifiers: [{ emailAddress: hash('u4@x.com') }] } });
  });

  it('should reject empty input, bad limits and members without identifiers', () => {
    expect(() => buildMemberBatches({ members: [], limit: 10 })).toThrow('At least one member');
    expect(() => buildMemberBatches({ members: [{ email: 'a@x.com' }], limit: 0 })).toThrow('positive integer');
    expect(() => buildMemberBatches({ members: [{ email: 'a@x.com' }, {}], limit: 10 })).toThrow('Member #2 has no identifier');
  });
});

describe('toMemberInput()', () => {
  it('should keep the known string fields of a member entry', () => {
    expect(toMemberInput({ email: 'a@x.com', phone: '+5511999999999', firstName: 'Ana', lastName: 'Silva', countryCode: 'BR', postalCode: '01000-000', extra: 'x' })).toEqual({
      email: 'a@x.com',
      phone: '+5511999999999',
      firstName: 'Ana',
      lastName: 'Silva',
      countryCode: 'BR',
      postalCode: '01000-000',
    });
  });

  it('should drop non-string values and tolerate non-object entries', () => {
    expect(toMemberInput({ email: 42, phone: null })).toEqual({ email: undefined, phone: undefined, firstName: undefined, lastName: undefined, countryCode: undefined, postalCode: undefined });
    expect(toMemberInput(null)).toEqual({});
    expect(toMemberInput('a@x.com')).toEqual({});
  });
});
