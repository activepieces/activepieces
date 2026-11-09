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
  if ((!relative && !absolute) || hasControlCharacter(href)) {
    return { kind: 'unsafe' };
  }
  const url = parseUrl({ href, origin });
  if (url === null) {
    return { kind: 'unsafe' };
  }
  if (url.origin !== origin) {
    return relative ? { kind: 'unsafe' } : { kind: 'external', href: url.href };
  }
  if (hasAmbiguousPath(href)) {
    return { kind: 'unsafe' };
  }
  if (isAppPage(url.pathname)) {
    return { kind: 'app', route: `${url.pathname}${url.search}${url.hash}` };
  }
  const opensOutsideApp =
    isPublicPage(url.pathname) || (!relative && isApiPath(url.pathname));
  return opensOutsideApp
    ? { kind: 'external', href: url.href }
    : { kind: 'unsafe' };
}

function hasAmbiguousPath(href: string): boolean {
  const path = href.split(/[?#]/)[0];
  return (
    path.startsWith('//') || path.includes('\\') || ENCODED_SLASH.test(path)
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

function isPublicPage(pathname: string): boolean {
  return PUBLIC_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
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
const PUBLIC_PAGES = ['/forms', '/chats', '/templates'];

export const markdownTextUtils = {
  classifyLink,
};

export type MarkdownLink =
  | { kind: 'app'; route: string }
  | { kind: 'external'; href: string }
  | { kind: 'contact' }
  | { kind: 'unsafe' };
