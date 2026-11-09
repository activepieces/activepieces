import { isObject } from '@activepieces/core-utils';

import { routeLocation } from '@/lib/route-location';

function classifyLink({
  href,
  origin,
}: {
  href: string;
  origin: string;
}): MarkdownLink {
  if (href.startsWith('mailto:') || href.startsWith('tel:')) {
    return { kind: 'contact' };
  }
  const relative = href.startsWith('/');
  const absolute = href.startsWith('http://') || href.startsWith('https://');
  if ((!relative && !absolute) || hasAmbiguousPath(href)) {
    return { kind: 'unsafe' };
  }
  const url = parseUrl({ href, origin });
  if (url === null) {
    return { kind: 'unsafe' };
  }
  if (url.origin !== origin) {
    return relative ? { kind: 'unsafe' } : { kind: 'external' };
  }
  if (isAppPage(url.pathname)) {
    return { kind: 'app', route: `${url.pathname}${url.search}${url.hash}` };
  }
  return !relative && isApiPath(url.pathname)
    ? { kind: 'external' }
    : { kind: 'unsafe' };
}

function hasAmbiguousPath(href: string): boolean {
  return (
    href.startsWith('//') ||
    href.includes('\\') ||
    hasControlCharacter(href) ||
    ENCODED_SLASH.test(href)
  );
}

function hasControlCharacter(value: string): boolean {
  return Array.from(value).some((char) => {
    const code = char.charCodeAt(0);
    return code < 0x20 || code === 0x7f;
  });
}

function isAppPage(pathname: string): boolean {
  const handle = routeLocation.handleOf(pathname);
  return (
    isObject(handle) &&
    typeof handle.shell === 'string' &&
    APP_SHELLS.includes(handle.shell) &&
    handle.allowAnonymous !== true
  );
}

function isApiPath(pathname: string): boolean {
  return pathname === '/api' || pathname.startsWith('/api/');
}

function parseUrl({ href, origin }: { href: string; origin: string }) {
  return URL.canParse(href, origin) ? new URL(href, origin) : null;
}

const ENCODED_SLASH = /%(2f|5c)/i;
const APP_SHELLS = ['project', 'builder', 'platform'];

export const markdownTextUtils = {
  classifyLink,
};

export type MarkdownLink =
  | { kind: 'app'; route: string }
  | { kind: 'external' }
  | { kind: 'contact' }
  | { kind: 'unsafe' };
