// The assistant renders each email as a ```email fenced block, but a list of
// emails is interleaved with thin connective nodes: a `---` divider and a short
// `**Row N — …**` label before each one. So the email <pre> blocks are NOT
// adjacent in the hast tree. We detect a run of "email units" — each an email
// block optionally preceded by a divider and a short label — and coalesce a run
// of 2+ under a single <section> carrier (a real HTML tag, so it stays a valid
// key in react-markdown's typed Components map, that Markdown/GFM and the
// streaming word-fade plugin never emit). Intro prose stays outside the group
// because a long paragraph is not treated as a label.
const GROUP_TAG_NAME = 'section';

const EMAIL_CODE_CLASSES = ['language-email', 'language-eml'];

const LABEL_TAGS = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

const LABEL_MAX_LENGTH = 120;

function classNames(node: EmailGroupHastNode | undefined): string[] {
  const className = node?.properties?.className;
  if (Array.isArray(className)) {
    return className.filter(
      (entry): entry is string => typeof entry === 'string',
    );
  }
  if (typeof className === 'string') return className.split(/\s+/);
  return [];
}

function isEmailBlock(node: EmailGroupHastNode | undefined): boolean {
  if (!node || node.type !== 'element' || node.tagName !== 'pre') return false;
  const code = node.children?.find(
    (child) => child.type === 'element' && child.tagName === 'code',
  );
  return classNames(code).some((entry) => EMAIL_CODE_CLASSES.includes(entry));
}

function isHr(node: EmailGroupHastNode | undefined): boolean {
  return node?.type === 'element' && node.tagName === 'hr';
}

function isLabelTag(node: EmailGroupHastNode | undefined): boolean {
  return (
    node?.type === 'element' &&
    typeof node.tagName === 'string' &&
    LABEL_TAGS.includes(node.tagName)
  );
}

function isBlankText(node: EmailGroupHastNode | undefined): boolean {
  return node?.type === 'text' && (node.value ?? '').trim().length === 0;
}

function textOf(node: EmailGroupHastNode): string {
  if (node.type === 'text') return node.value ?? '';
  if (!node.children) return '';
  return node.children.map(textOf).join('');
}

function skipBlanks(children: EmailGroupHastNode[], from: number): number {
  let i = from;
  while (i < children.length && isBlankText(children[i])) i++;
  return i;
}

// An email unit is: [divider] [short label] email-block, with optional blank
// text between. Returns the inclusive span [begin, end] or null when no email
// block sits at the expected position.
function matchUnit(
  children: EmailGroupHastNode[],
  from: number,
): { begin: number; end: number } | null {
  const begin = skipBlanks(children, from);
  let i = begin;
  if (i >= children.length) return null;
  if (isHr(children[i])) i = skipBlanks(children, i + 1);
  if (isLabelTag(children[i])) {
    const afterLabel = skipBlanks(children, i + 1);
    const labelFits = textOf(children[i]).trim().length <= LABEL_MAX_LENGTH;
    if (labelFits && isEmailBlock(children[afterLabel])) {
      i = afterLabel;
    } else {
      return null;
    }
  }
  return isEmailBlock(children[i]) ? { begin, end: i } : null;
}

function groupChildren(children: EmailGroupHastNode[]): EmailGroupHastNode[] {
  const out: EmailGroupHastNode[] = [];
  let i = 0;
  while (i < children.length) {
    const first = matchUnit(children, i);
    if (first) {
      const units = [first];
      let next = matchUnit(children, first.end + 1);
      while (next) {
        units.push(next);
        next = matchUnit(children, next.end + 1);
      }
      if (units.length >= 2) {
        const start = units[0].begin;
        const end = units[units.length - 1].end;
        out.push({
          type: 'element',
          tagName: GROUP_TAG_NAME,
          properties: { dataEmailGroup: 'true' },
          children: children.slice(start, end + 1),
        });
        i = end + 1;
        continue;
      }
    }
    const child = children[i];
    out.push(
      child.type === 'element' && child.children
        ? { ...child, children: groupChildren(child.children) }
        : child,
    );
    i++;
  }
  return out;
}

function apply({ tree }: { tree: EmailGroupHastNode }): void {
  if (!tree.children) return;
  tree.children = groupChildren(tree.children);
}

export const rehypeEmailGroup =
  () =>
  (tree: EmailGroupHastNode): void =>
    apply({ tree });

export const emailGroupMarker = { apply, tagName: GROUP_TAG_NAME };

export type EmailGroupHastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: EmailGroupHastNode[];
};
