function classifyLink({
  href,
  origin,
}: {
  href: string;
  origin: string;
}): MarkdownLink {
  if (href.startsWith('/') && !href.startsWith('//')) {
    return isAppRoute(href) ? { kind: 'app', route: href } : { kind: 'unsafe' };
  }
  if (href.startsWith('mailto:') || href.startsWith('tel:')) {
    return { kind: 'contact' };
  }
  if (!href.startsWith('http://') && !href.startsWith('https://')) {
    return { kind: 'unsafe' };
  }
  const url = parseUrl(href);
  if (url && url.origin === origin) {
    const route = `${url.pathname}${url.search}${url.hash}`;
    if (isAppRoute(route)) return { kind: 'app', route };
  }
  return { kind: 'external' };
}

function isAppRoute(route: string): boolean {
  return !route.startsWith('/api/') && route !== '/api';
}

function parseUrl(href: string): URL | null {
  return URL.canParse(href) ? new URL(href) : null;
}

export const markdownTextUtils = {
  classifyLink,
};

export type MarkdownLink =
  | { kind: 'app'; route: string }
  | { kind: 'external' }
  | { kind: 'contact' }
  | { kind: 'unsafe' };
