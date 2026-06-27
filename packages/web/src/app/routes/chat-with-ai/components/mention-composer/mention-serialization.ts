import { ChatMention, ChatMentionType } from '@activepieces/shared';
import { JSONContent } from '@tiptap/core';

const MENTION_TOKEN_REGEX = /@\[(flow|table|app):([^:\]]+):([^\]]*)\]/g;

function sanitizeLabel(label: string): string {
  return label.replace(/[\]\r\n]/g, ' ').trim();
}

function serializeToken(mention: MentionDraft): string {
  return `@[${mention.type}:${mention.id}:${sanitizeLabel(mention.label)}]`;
}

function nodesToValue(nodes: JSONContent[]): {
  content: string;
  mentions: MentionDraft[];
} {
  const parts: string[] = [];
  const mentions: MentionDraft[] = [];

  nodes.forEach((node, index) => {
    switch (node.type) {
      case 'text':
        parts.push(node.text ?? '');
        break;
      case 'hardBreak':
        parts.push('\n');
        break;
      case 'mention': {
        const draft = attrsToDraft(node.attrs);
        if (draft) {
          parts.push(serializeToken(draft));
          mentions.push(draft);
        }
        break;
      }
      case 'paragraph': {
        const child = nodesToValue(node.content ?? []);
        parts.push(child.content);
        mentions.push(...child.mentions);
        if (index < nodes.length - 1) {
          parts.push('\n');
        }
        break;
      }
      default:
        break;
    }
  });

  return { content: parts.join(''), mentions };
}

function attrsToDraft(
  attrs: Record<string, unknown> | undefined,
): MentionDraft | null {
  if (!attrs) {
    return null;
  }
  const type = attrs.mentionType;
  const id = attrs.entityId;
  const label = attrs.label;
  if (
    !isMentionType(type) ||
    typeof id !== 'string' ||
    typeof label !== 'string'
  ) {
    return null;
  }
  const logoUrl = typeof attrs.logoUrl === 'string' ? attrs.logoUrl : undefined;
  return { type, id, label, logoUrl };
}

function isMentionType(value: unknown): value is ChatMentionType {
  return (
    value === ChatMentionType.FLOW ||
    value === ChatMentionType.TABLE ||
    value === ChatMentionType.APP
  );
}

function dedupeMentions(mentions: MentionDraft[]): ChatMention[] {
  const seen = new Set<string>();
  const result: ChatMention[] = [];
  for (const m of mentions) {
    const key = `${m.type}:${m.id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push({ type: m.type, id: m.id, label: m.label });
  }
  return result;
}

function editorJsonToValue(doc: JSONContent): {
  content: string;
  mentions: ChatMention[];
} {
  const { content, mentions } = nodesToValue(doc.content ?? []);
  return { content: content.trim(), mentions: dedupeMentions(mentions) };
}

function parseTokens(
  content: string,
): Array<
  { kind: 'text'; value: string } | { kind: 'mention'; mention: ChatMention }
> {
  const segments: Array<
    { kind: 'text'; value: string } | { kind: 'mention'; mention: ChatMention }
  > = [];
  let lastIndex = 0;
  for (const match of content.matchAll(MENTION_TOKEN_REGEX)) {
    const matchIndex = match.index ?? 0;
    if (matchIndex > lastIndex) {
      segments.push({
        kind: 'text',
        value: content.slice(lastIndex, matchIndex),
      });
    }
    segments.push({
      kind: 'mention',
      mention: {
        type: match[1] as ChatMentionType,
        id: match[2],
        label: match[3],
      },
    });
    lastIndex = matchIndex + match[0].length;
  }
  if (lastIndex < content.length) {
    segments.push({ kind: 'text', value: content.slice(lastIndex) });
  }
  return segments;
}

export const mentionSerialization = {
  serializeToken,
  editorJsonToValue,
  parseTokens,
};

export type MentionDraft = {
  type: ChatMentionType;
  id: string;
  label: string;
  logoUrl?: string;
};
