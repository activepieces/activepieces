import { MessageBlock } from '@activepieces/shared';

export function getTextFromBlocks(blocks: MessageBlock[]): string {
  return blocks
    .filter((b): b is MessageBlock & { type: 'text' } => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

export function parseCodeBlock(
  content: string,
  fence: string,
): { block: string | null; cleanContent: string } {
  const regex = new RegExp(
    `\`\`\`\\s*${fence}\\s*\\r?\\n([\\s\\S]*?)\\r?\\n?\\s*\`\`\``,
  );
  const match = regex.exec(content);
  if (!match) return { block: null, cleanContent: content };
  return {
    block: match[1],
    cleanContent: content
      .replace(match[0], '')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  };
}

export function parseQuickReplies(content: string): {
  replies: string[];
  cleanContent: string;
} {
  const { block, cleanContent } = parseCodeBlock(content, 'quick-replies');
  if (!block) return { replies: [], cleanContent: content };

  const replies = block
    .split('\n')
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace(/^-\s+/, '').trim())
    .filter((line) => line.length > 0 && line.length < 80);

  return { replies, cleanContent };
}

export function parseAutomationProposal(content: string): {
  proposal: AutomationProposal | null;
  cleanContent: string;
} {
  const { block, cleanContent } = parseCodeBlock(
    content,
    'automation-proposal',
  );
  if (!block) return { proposal: null, cleanContent };

  const titleMatch = /^title:\s*(.+)$/m.exec(block);
  const descMatch = /^description:\s*(.+)$/m.exec(block);
  const stepsMatch = block.match(/^-\s+.+$/gm);

  if (!titleMatch || !stepsMatch || stepsMatch.length === 0) {
    return { proposal: null, cleanContent: content };
  }

  return {
    proposal: {
      title: titleMatch[1].trim(),
      description: descMatch?.[1].trim() ?? '',
      steps: stepsMatch.map((s) => s.replace(/^-\s+/, '').trim()),
    },
    cleanContent,
  };
}

export function parseAllConnectionsRequired(content: string): {
  connections: ConnectionRequired[];
  cleanContent: string;
} {
  const connections: ConnectionRequired[] = [];
  const regex = /```\s*connection-required\s*\r?\n([\s\S]*?)\r?\n?\s*```/g;
  let cleaned = content;
  let match = regex.exec(content);

  while (match) {
    const block = match[1];
    const pieceMatch = /^piece:\s*(.+)$/m.exec(block);
    const nameMatch = /^displayName:\s*(.+)$/m.exec(block);
    if (pieceMatch) {
      connections.push({
        piece: pieceMatch[1].trim(),
        displayName: nameMatch?.[1].trim() ?? pieceMatch[1].trim(),
      });
    }
    cleaned = cleaned.replace(match[0], '');
    match = regex.exec(content);
  }

  return { connections, cleanContent: cleaned.trim() };
}

export type AutomationProposal = {
  title: string;
  description: string;
  steps: string[];
};

export type ConnectionRequired = {
  piece: string;
  displayName: string;
};
