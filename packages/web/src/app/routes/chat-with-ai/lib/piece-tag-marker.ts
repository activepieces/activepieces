const MARKER_SOURCE = '\\{\\{app:([^}]+)\\}\\}';

// The assistant wraps app names as `{{app:Gmail}}`. We carry resolved tags on a
// `<data>` element: it is a real inline HTML tag (so it stays a valid key in
// react-markdown's strictly-typed `Components` map) that neither Markdown/GFM nor
// the streaming word-fade plugin ever emit, so overriding it is collision-free.
const PIECE_TAG_NAME = 'data';

// Don't decorate inside code, links, or an already-injected tag.
const SKIP_TAGS = new Set(['code', 'pre', 'a', PIECE_TAG_NAME]);

function stripPieceTags(text: string): string {
  return text.replace(new RegExp(MARKER_SOURCE, 'g'), (_match, name: string) =>
    name.trim(),
  );
}

function splitTextNode({
  value,
  resolve,
}: {
  value: string;
  resolve: ResolvePiece;
}): PieceTagHastNode[] | null {
  const regex = new RegExp(MARKER_SOURCE, 'g');
  const out: PieceTagHastNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(value)) !== null) {
    if (match.index > lastIndex) {
      out.push({ type: 'text', value: value.slice(lastIndex, match.index) });
    }
    const name = match[1].trim();
    const hit = resolve(name);
    out.push(
      hit
        ? {
            type: 'element',
            tagName: PIECE_TAG_NAME,
            properties: { logourl: hit.logoUrl },
            children: [{ type: 'text', value: hit.displayName }],
          }
        : { type: 'text', value: name },
    );
    lastIndex = match.index + match[0].length;
  }
  if (out.length === 0) return null;
  if (lastIndex < value.length) {
    out.push({ type: 'text', value: value.slice(lastIndex) });
  }
  return out;
}

function applyPieceTags({
  tree,
  resolve,
}: {
  tree: PieceTagHastNode;
  resolve: ResolvePiece;
}): void {
  walk({ node: tree, resolve, insideSkip: false });
}

function walk({
  node,
  resolve,
  insideSkip,
}: {
  node: PieceTagHastNode;
  resolve: ResolvePiece;
  insideSkip: boolean;
}): void {
  if (!node.children) return;
  node.children = node.children.flatMap((child) => {
    if (
      child.type === 'text' &&
      !insideSkip &&
      typeof child.value === 'string'
    ) {
      return splitTextNode({ value: child.value, resolve }) ?? [child];
    }
    if (child.type === 'element') {
      const skip =
        insideSkip || (child.tagName ? SKIP_TAGS.has(child.tagName) : false);
      walk({ node: child, resolve, insideSkip: skip });
    }
    return [child];
  });
}

export const pieceTagMarker = {
  strip: stripPieceTags,
  splitTextNode,
  apply: applyPieceTags,
  tagName: PIECE_TAG_NAME,
};

export type PieceLogoHit = {
  logoUrl: string;
  displayName: string;
};

export type ResolvePiece = (name: string) => PieceLogoHit | undefined;

export type PieceTagHastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: PieceTagHastNode[];
};
