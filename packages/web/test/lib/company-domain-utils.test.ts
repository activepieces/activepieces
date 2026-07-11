import { describe, expect, it } from 'vitest';

import { companyDomainUtils } from '@/lib/company-domain-utils';

const { companyDomainFromEmail, normalizeWebsite, deriveWorkspaceName } =
  companyDomainUtils;

describe('companyDomainFromEmail', () => {
  it('returns the domain for a corporate email', () => {
    expect(companyDomainFromEmail('ash@activepieces.com')).toBe(
      'activepieces.com',
    );
  });

  it('returns null for free-mail providers', () => {
    expect(companyDomainFromEmail('ash@gmail.com')).toBeNull();
    expect(companyDomainFromEmail('ash@yahoo.co.uk')).toBeNull();
    expect(companyDomainFromEmail('ash@proton.me')).toBeNull();
  });

  it('lowercases and handles missing @', () => {
    expect(companyDomainFromEmail('ash@ACME.com')).toBe('acme.com');
    expect(companyDomainFromEmail('not-an-email')).toBeNull();
    expect(companyDomainFromEmail('')).toBeNull();
  });
});

describe('normalizeWebsite', () => {
  it('passes through a bare domain', () => {
    expect(normalizeWebsite('acme.com')).toBe('acme.com');
  });

  it('strips scheme, www, path, query, port and case', () => {
    expect(normalizeWebsite('https://www.Acme.com/about?x=1')).toBe(
      'acme.com',
    );
    expect(normalizeWebsite('http://acme.com:8080/pricing#top')).toBe(
      'acme.com',
    );
    expect(normalizeWebsite('//acme.com/')).toBe('acme.com');
  });

  it('strips a single leading www/mail label only', () => {
    expect(normalizeWebsite('mail.acme.com')).toBe('acme.com');
    expect(normalizeWebsite('app.acme.com')).toBe('app.acme.com');
    expect(normalizeWebsite('www.acme.co.uk')).toBe('acme.co.uk');
  });

  it('handles trailing dots and multi-part TLDs', () => {
    expect(normalizeWebsite('acme.com.')).toBe('acme.com');
    expect(normalizeWebsite('acme.co.uk')).toBe('acme.co.uk');
  });

  it('rejects invalid input', () => {
    expect(normalizeWebsite('')).toBeNull();
    expect(normalizeWebsite('acme')).toBeNull();
    expect(normalizeWebsite('http://')).toBeNull();
    expect(normalizeWebsite('not a domain')).toBeNull();
    expect(normalizeWebsite('-bad.com')).toBeNull();
  });
});

describe('deriveWorkspaceName', () => {
  it('derives from the first domain label, title-cased', () => {
    expect(deriveWorkspaceName({ website: 'acme.com', email: null })).toBe(
      'Acme',
    );
    expect(deriveWorkspaceName({ website: 'acme.co.uk', email: null })).toBe(
      'Acme',
    );
  });

  it('turns hyphens into spaces', () => {
    expect(
      deriveWorkspaceName({ website: 'my-startup.com', email: null }),
    ).toBe('My Startup');
    expect(
      deriveWorkspaceName({ website: 'acme-widgets.com', email: null }),
    ).toBe('Acme Widgets');
  });

  it('falls back to the email local part before separators', () => {
    expect(
      deriveWorkspaceName({ website: null, email: 'ash@gmail.com' }),
    ).toBe('Ash');
    expect(
      deriveWorkspaceName({ website: null, email: 'ash.sam@gmail.com' }),
    ).toBe('Ash');
    expect(deriveWorkspaceName({ website: null, email: 'a+b@gmail.com' })).toBe(
      'A',
    );
  });

  it('falls back to a generic name when nothing usable', () => {
    expect(deriveWorkspaceName({ website: null, email: null })).toBe(
      'My Workspace',
    );
    expect(deriveWorkspaceName({ website: null, email: '@gmail.com' })).toBe(
      'My Workspace',
    );
  });

  it('never contains "." or "/" (platform name rule)', () => {
    const cases = [
      { website: 'acme.com', email: null },
      { website: 'my-startup.co.uk', email: null },
      { website: null, email: 'ash.sam@gmail.com' },
      { website: null, email: 'a/b.c@gmail.com' },
      { website: null, email: null },
    ];
    for (const input of cases) {
      const name = deriveWorkspaceName(input);
      expect(name).not.toMatch(/[./]/);
      expect(name.length).toBeGreaterThan(0);
    }
  });
});
