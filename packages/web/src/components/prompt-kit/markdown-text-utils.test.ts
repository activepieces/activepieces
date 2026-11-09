import { describe, expect, it } from 'vitest';

import { markdownTextUtils } from './markdown-text-utils';

const ORIGIN = 'https://app.example.com';

describe('markdownTextUtils.classifyLink', () => {
  it('treats relative app paths as in-app routes', () => {
    expect(
      markdownTextUtils.classifyLink({
        href: '/projects/p1/tables/t1',
        origin: ORIGIN,
      }),
    ).toEqual({ kind: 'app', route: '/projects/p1/tables/t1' });
  });

  it('treats same-origin absolute URLs as in-app routes', () => {
    expect(
      markdownTextUtils.classifyLink({
        href: `${ORIGIN}/projects/p1/flows/f1?x=1#y`,
        origin: ORIGIN,
      }),
    ).toEqual({ kind: 'app', route: '/projects/p1/flows/f1?x=1#y' });
  });

  it('keeps other origins and protocol-relative URLs external or unsafe', () => {
    expect(
      markdownTextUtils.classifyLink({
        href: 'https://docs.example.org/a',
        origin: ORIGIN,
      }),
    ).toEqual({ kind: 'external' });
    expect(
      markdownTextUtils.classifyLink({ href: '//evil.com/x', origin: ORIGIN }),
    ).toEqual({ kind: 'unsafe' });
  });

  it('never routes API paths in-app', () => {
    expect(
      markdownTextUtils.classifyLink({
        href: `${ORIGIN}/api/v1/files/1`,
        origin: ORIGIN,
      }),
    ).toEqual({ kind: 'external' });
    expect(
      markdownTextUtils.classifyLink({ href: '/api/v1/x', origin: ORIGIN }),
    ).toEqual({ kind: 'unsafe' });
  });

  it('classifies contact and unsafe protocols', () => {
    expect(
      markdownTextUtils.classifyLink({ href: 'mailto:a@b.c', origin: ORIGIN }),
    ).toEqual({ kind: 'contact' });
    expect(
      markdownTextUtils.classifyLink({
        href: 'javascript:alert(1)',
        origin: ORIGIN,
      }),
    ).toEqual({ kind: 'unsafe' });
  });
});
