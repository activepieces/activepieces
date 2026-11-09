// @vitest-environment jsdom
import { createMemoryRouter } from 'react-router-dom';
import { beforeAll, describe, expect, it } from 'vitest';

import { markdownTextUtils } from '@/components/prompt-kit/markdown-text-utils';
import { routeLocation } from '@/lib/route-location';
import { routesThatRequireProjectId } from '@/lib/route-utils';

const ORIGIN = 'https://app.example.com';

describe('markdownTextUtils.classifyLink', () => {
  beforeAll(() => {
    routeLocation.track(createMemoryRouter(testRoutes()));
  });

  it.each([
    '/projects/p1/flows/f1',
    '/projects/p1/tables/t1',
    '/projects/p1/runs/r1',
    '/flows/f1',
    '/platform/projects',
  ])('routes the app page %s in-app', (href) => {
    expect(classify(href)).toEqual({ kind: 'app', route: href });
  });

  it('keeps the query and hash of an app link', () => {
    expect(classify('/projects/p1/tables/t1?view=all#row-2')).toEqual({
      kind: 'app',
      route: '/projects/p1/tables/t1?view=all#row-2',
    });
  });

  it('routes same-origin app pages in-app', () => {
    expect(classify(`${ORIGIN}/projects/p1/flows/f1?x=1#y`)).toEqual({
      kind: 'app',
      route: '/projects/p1/flows/f1?x=1#y',
    });
  });

  it.each([
    '/\\evil.com',
    '/\\/evil.com',
    '//evil.com/x',
    '/%2fevil.com',
    '/%5Cevil.com',
    '/projects/p1%2F..%2F..%2Fauthenticate',
    '/\tevil.com',
    '/\nevil.com',
    '/authenticate?response=eyJ0b2tlbiI6IngifQ',
    '/redirect?url=https://evil.com',
    '/embed/flows/f1',
    '/projects/p1/../../authenticate?response=x',
    '/not-a-page',
    '/api/v1/files/1',
  ])('never routes %s in-app', (href) => {
    expect(classify(href)).toEqual({ kind: 'unsafe' });
  });

  it.each([
    `${ORIGIN}/authenticate?response=x`,
    `${ORIGIN}/redirect`,
    `${ORIGIN}/embed`,
    `${ORIGIN}/\\evil.com`,
    `${ORIGIN}/%2f%2fevil.com`,
  ])('applies the same rule to the same-origin URL %s', (href) => {
    expect(classify(href)).toEqual({ kind: 'unsafe' });
  });

  it('opens same-origin API files outside the app', () => {
    expect(classify(`${ORIGIN}/api/v1/files/1`)).toEqual({
      kind: 'external',
      href: `${ORIGIN}/api/v1/files/1`,
    });
  });

  it('keeps other origins external', () => {
    expect(classify('https://docs.example.org/a')).toEqual({
      kind: 'external',
      href: 'https://docs.example.org/a',
    });
  });

  it.each([
    ['/forms/f1', `${ORIGIN}/forms/f1`],
    ['/chats/f1', `${ORIGIN}/chats/f1`],
    ['/templates/t1', `${ORIGIN}/templates/t1`],
    [`${ORIGIN}/forms/f1?x=1`, `${ORIGIN}/forms/f1?x=1`],
  ])('opens the public page %s outside the app', (href, opened) => {
    expect(classify(href)).toEqual({ kind: 'external', href: opened });
  });

  it.each([
    '/mcp-authorize',
    `${ORIGIN}/mcp-authorize`,
    '/forms/../authenticate',
    '/forms%2F..%2Fauthenticate',
  ])('keeps %s blocked', (href) => {
    expect(classify(href)).toEqual({ kind: 'unsafe' });
  });

  it('keeps a signed URL with an encoded slash in its query clickable', () => {
    const signed =
      'https://bucket.s3.amazonaws.com/f.png?X-Amz-Credential=AK%2F20260101%2Fus';
    expect(classify(signed)).toEqual({ kind: 'external', href: signed });
  });

  it('routes an app page with an encoded slash in its query in-app', () => {
    expect(classify('/projects/p1/tables/t1?filter=a%2Fb')).toEqual({
      kind: 'app',
      route: '/projects/p1/tables/t1?filter=a%2Fb',
    });
  });

  it('classifies contact and unsafe protocols', () => {
    expect(classify('mailto:a@b.c')).toEqual({ kind: 'contact' });
    expect(classify('javascript:alert(1)')).toEqual({ kind: 'unsafe' });
  });
});

function classify(href: string) {
  return markdownTextUtils.classifyLink({ href, origin: ORIGIN });
}

function testRoutes() {
  const project = { shell: 'project' };
  const builder = { shell: 'builder' };
  const projectPages = [
    { path: routesThatRequireProjectId.tables, handle: project },
    { path: routesThatRequireProjectId.singleTable, handle: project },
    { path: routesThatRequireProjectId.runs, handle: project },
    { path: routesThatRequireProjectId.singleRun, handle: project },
    { path: routesThatRequireProjectId.singleFlow, handle: builder },
  ];
  return [
    { path: '/authenticate', element: null },
    { path: '/redirect', element: null },
    { path: '/embed/*', element: null },
    {
      element: null,
      children: [
        ...projectPages.flatMap((page) => [
          page,
          { ...page, path: `/projects/:projectId${page.path}` },
        ]),
        { path: '/platform/projects', handle: { shell: 'platform' } },
        {
          path: '/templates/:templateId',
          handle: { shell: 'project', allowAnonymous: true },
        },
        {
          path: '/*',
          handle: { shell: 'project', allowAnonymous: true },
        },
      ],
    },
  ];
}
