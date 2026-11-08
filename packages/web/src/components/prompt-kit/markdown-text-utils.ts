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

function cleanChatMarkdown(markdown: string): string {
  let inCodeBlock = false;
  return markdown
    .split('\n')
    .map((line) => {
      if (line.trim().startsWith('```')) {
        inCodeBlock = !inCodeBlock;
        return line;
      }
      if (inCodeBlock) return line;
      return line
        .split(INLINE_CODE)
        .map((segment, index) =>
          index % 2 === 1 ? segment : segment.replace(LINKS_TAG, ''),
        )
        .join('')
        .replace(LEADING_BREAKS, '');
    })
    .join('\n');
}

function remarkHtmlBreaks() {
  return (tree: MarkdownNode): MarkdownNode => toBreaks(tree);
}

function toBreaks(node: MarkdownNode): MarkdownNode {
  if (node.type === 'html' && BREAK_TAG.test(node.value ?? '')) {
    return { type: 'break', position: node.position };
  }
  if (!node.children) return node;
  return { ...node, children: node.children.map(toBreaks) };
}

function isAppRoute(route: string): boolean {
  return !route.startsWith('/api/') && route !== '/api';
}

function parseUrl(href: string): URL | null {
  return URL.canParse(href) ? new URL(href) : null;
}

const INLINE_CODE = /(`[^`]*`)/;
const LINKS_TAG = /<\/?links>/gi;
const LEADING_BREAKS = /^(\s*<br\s*\/?>)+\s*/i;
const BREAK_TAG = /^<br\s*\/?>$/i;

export const markdownTextUtils = {
  classifyLink,
  cleanChatMarkdown,
  remarkHtmlBreaks,
};

export type MarkdownLink =
  | { kind: 'app'; route: string }
  | { kind: 'external' }
  | { kind: 'contact' }
  | { kind: 'unsafe' };

type MarkdownNode = {
  type: string;
  value?: string;
  position?: unknown;
  children?: MarkdownNode[];
};
