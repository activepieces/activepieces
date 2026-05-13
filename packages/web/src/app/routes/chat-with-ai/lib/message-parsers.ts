import { AppConnectionStatus } from '@activepieces/shared';

import { ChatUIMessage } from '@/features/chat/lib/chat-types';

import { ProposalStep, stepVisuals } from './step-visuals';

const CONNECTION_STATUS_VALUES: ReadonlySet<string> = new Set(
  Object.values(AppConnectionStatus),
);

function toConnectionStatus(value: string): AppConnectionStatus {
  if (CONNECTION_STATUS_VALUES.has(value)) {
    return value as AppConnectionStatus;
  }
  return AppConnectionStatus.ACTIVE;
}

export function normalizePieceName(piece: string): string {
  const shortName = piece.replace(/[^a-z0-9-]/gi, '');
  return piece.startsWith('@activepieces/')
    ? piece
    : `@activepieces/piece-${shortName}`;
}

export function getTextFromParts(parts: ChatUIMessage['parts']): string {
  return parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
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

const SPECIAL_FENCES = [
  'multi-question',
  'automation-proposal',
  'connection-required',
  'connection-picker',
  'project-picker',
  'build-progress',
  'quick-replies',
];

export function stripIncompleteSpecialBlock(content: string): string {
  for (const fence of SPECIAL_FENCES) {
    const openPattern = new RegExp(`\`\`\`\\s*${fence}\\b`);
    const openMatch = openPattern.exec(content);
    if (!openMatch) continue;

    const afterOpening = content.slice(openMatch.index + openMatch[0].length);
    if (/```/.test(afterOpening)) continue;

    return content
      .slice(0, openMatch.index)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  return content;
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
  const complete = parseCodeBlock(content, 'automation-proposal');
  if (complete.block) {
    return parseProposalBlock({
      block: complete.block,
      cleanContent: complete.cleanContent,
      isComplete: true,
      originalContent: content,
    });
  }

  const openRegex = /```\s*automation-proposal\s*\r?\n([\s\S]*)$/;
  const openMatch = openRegex.exec(content);
  if (!openMatch) return { proposal: null, cleanContent: content };
  if (/```/.test(openMatch[1])) {
    return { proposal: null, cleanContent: content };
  }

  const partialClean = content
    .slice(0, openMatch.index)
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return parseProposalBlock({
    block: openMatch[1],
    cleanContent: partialClean,
    isComplete: false,
    originalContent: content,
  });
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
    const statusMatch = /^status:\s*(.+)$/m.exec(block);
    if (pieceMatch) {
      connections.push({
        piece: pieceMatch[1].trim(),
        displayName: nameMatch?.[1].trim() ?? pieceMatch[1].trim(),
        status: statusMatch?.[1].trim() === 'error' ? 'error' : undefined,
      });
    }
    cleaned = cleaned.replace(match[0], '');
    match = regex.exec(content);
  }

  return { connections, cleanContent: cleaned.trim() };
}

function parseProposalBlock({
  block,
  cleanContent,
  isComplete,
  originalContent,
}: {
  block: string;
  cleanContent: string;
  isComplete: boolean;
  originalContent: string;
}): { proposal: AutomationProposal | null; cleanContent: string } {
  const titleLineRegex = /^title:\s*(.+)\r?\n/m;
  const titleMatch = titleLineRegex.exec(block);
  if (!titleMatch) {
    return { proposal: null, cleanContent: originalContent };
  }

  const descMatch = /^description:\s*(.+)\r?\n/m.exec(block);

  const lines = block.split('\n');
  const trailingNewline = block.endsWith('\n');
  const stepLabels: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!/^-\s+/.test(line)) continue;
    const isLastLine = i === lines.length - 1;
    if (!isComplete && isLastLine && !trailingNewline) continue;
    stepLabels.push(line.replace(/^-\s+/, '').trim());
  }

  if (isComplete && stepLabels.length === 0) {
    return { proposal: null, cleanContent: originalContent };
  }

  const steps: ProposalStep[] = stepLabels.map((label, index) => ({
    label,
    kind: stepVisuals.inferKind({ label, index }),
    piece: stepVisuals.inferPieceName({ label }),
  }));

  return {
    proposal: {
      title: titleMatch[1].trim(),
      description: descMatch?.[1].trim() ?? '',
      steps,
      isComplete,
    },
    cleanContent,
  };
}

export type AutomationProposal = {
  title: string;
  description: string;
  steps: ProposalStep[];
  isComplete: boolean;
};

export type ConnectionRequired = {
  piece: string;
  displayName: string;
  status?: 'error';
};

export type MultiQuestion = {
  title?: string;
  question: string;
  type: 'choice' | 'text';
  options?: string[];
  placeholder?: string;
};

export function parseMultiQuestion(content: string): {
  questions: MultiQuestion[];
  cleanContent: string;
} {
  const { block, cleanContent } = parseCodeBlock(content, 'multi-question');
  if (!block) return { questions: [], cleanContent: content };

  const questions: MultiQuestion[] = [];
  const sections = block.split(/^---$/m);

  for (const section of sections) {
    const questionMatch = /^question:\s*(.+)$/m.exec(section);
    const typeMatch = /^type:\s*(choice|text)$/m.exec(section);
    if (!questionMatch || !typeMatch) continue;

    const titleMatch = /^title:\s*(.+)$/m.exec(section);
    const q: MultiQuestion = {
      title: titleMatch ? titleMatch[1].trim() : undefined,
      question: questionMatch[1].trim(),
      type: typeMatch[1] as 'choice' | 'text',
    };

    if (q.type === 'choice') {
      const optionLines = section.match(/^-\s+.+$/gm);
      q.options = optionLines?.map((l) => l.replace(/^-\s+/, '').trim()) ?? [];
    }

    const placeholderMatch = /^placeholder:\s*(.+)$/m.exec(section);
    if (placeholderMatch) {
      q.placeholder = placeholderMatch[1].trim();
    }

    questions.push(q);
  }

  return { questions, cleanContent };
}

export function parseConnectionPicker(content: string): {
  picker: ConnectionPickerData | null;
  cleanContent: string;
} {
  const { block, cleanContent } = parseCodeBlock(content, 'connection-picker');
  if (!block) return { picker: null, cleanContent: content };

  const pieceMatch = /^piece:\s*(.+)$/m.exec(block);
  const displayNameMatch = /^displayName:\s*(.+)$/m.exec(block);
  if (!pieceMatch) return { picker: null, cleanContent: content };

  const connections: ConnectionPickerData['connections'] = [];
  const connectionBlocks = block.split(/^-\s+label:\s*/m).slice(1);

  for (const connBlock of connectionBlocks) {
    const lines = connBlock.split('\n');
    const label = lines[0]?.trim();
    if (!label) continue;

    const projectMatch = /^\s+project:\s*(.+)$/m.exec(connBlock);
    const externalIdMatch = /^\s+externalId:\s*(.+)$/m.exec(connBlock);
    const projectIdMatch = /^\s+projectId:\s*(.+)$/m.exec(connBlock);
    const statusMatch = /^\s+status:\s*(.+)$/m.exec(connBlock);

    const externalId = externalIdMatch?.[1].trim() ?? '';
    const projectId = projectIdMatch?.[1].trim() ?? '';
    if (!externalId) continue;

    connections.push({
      label,
      project: projectMatch?.[1].trim() ?? '',
      externalId,
      projectId,
      status: toConnectionStatus(statusMatch?.[1].trim() ?? ''),
    });
  }

  return {
    picker: {
      piece: pieceMatch[1].trim(),
      displayName: displayNameMatch?.[1].trim() ?? pieceMatch[1].trim(),
      connections,
    },
    cleanContent,
  };
}

export type ConnectionPickerData = {
  piece: string;
  displayName: string;
  connections: Array<{
    label: string;
    project: string;
    externalId: string;
    projectId: string;
    status: AppConnectionStatus;
  }>;
};

export function parseProjectPicker(content: string): {
  picker: ProjectPickerData | null;
  cleanContent: string;
} {
  const { block, cleanContent } = parseCodeBlock(content, 'project-picker');
  if (!block) return { picker: null, cleanContent: content };

  const projects: ProjectPickerData['suggestedProjects'] = [];
  const projectBlocks = block.split(/^-\s+name:\s*/m).slice(1);

  for (const projBlock of projectBlocks) {
    const lines = projBlock.split('\n');
    const name = lines[0]?.trim();
    if (!name) continue;

    const idMatch = /^\s+id:\s*(.+)$/m.exec(projBlock);
    const id = idMatch?.[1].trim() ?? '';
    if (!id) continue;

    projects.push({ name, id });
  }

  if (projects.length === 0) return { picker: null, cleanContent: content };

  return {
    picker: { suggestedProjects: projects },
    cleanContent,
  };
}

export type ProjectPickerData = {
  suggestedProjects: Array<{
    name: string;
    id: string;
  }>;
};

export function parseBuildProgress(content: string): {
  progress: BuildProgressData | null;
  cleanContent: string;
} {
  const result = parseAllBuildProgress(content);
  return {
    progress: result.progressList[0] ?? null,
    cleanContent: result.cleanContent,
  };
}

export function parseAllBuildProgress(content: string): {
  progressList: BuildProgressData[];
  cleanContent: string;
} {
  const regex = /```\s*build-progress\s*\r?\n([\s\S]*?)\r?\n?\s*```/g;
  const progressList: BuildProgressData[] = [];
  let cleanContent = content;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const block = match[1];
    const parsed = parseBuildBlock(block);
    if (parsed) progressList.push(parsed);
    cleanContent = cleanContent
      .replace(match[0], '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  return { progressList, cleanContent };
}

function parseBuildBlock(block: string): BuildProgressData | null {
  const titleMatch = /^title:\s*(.+)$/m.exec(block);
  if (!titleMatch) return null;
  const projectMatch = /^project:\s*(.+)$/m.exec(block);

  const steps: BuildProgressData['steps'] = [];
  const stepBlocks = block.split(/^-\s+type:\s*/m).slice(1);

  for (const stepBlock of stepBlocks) {
    const lines = stepBlock.split('\n');
    const type = lines[0]?.trim();
    if (type !== 'trigger' && type !== 'action') continue;

    const pieceMatch = /^\s+piece:\s*(.+)$/m.exec(stepBlock);
    const labelMatch = /^\s+label:\s*(.+)$/m.exec(stepBlock);
    if (!pieceMatch || !labelMatch) continue;

    steps.push({
      type: type as 'trigger' | 'action',
      piece: pieceMatch[1].trim(),
      label: labelMatch[1].trim(),
    });
  }

  if (steps.length === 0) return null;

  return {
    title: titleMatch[1].trim(),
    project: projectMatch?.[1].trim() ?? '',
    steps,
  };
}

export type BuildProgressData = {
  title: string;
  project: string;
  steps: Array<{
    type: 'trigger' | 'action';
    piece: string;
    label: string;
  }>;
};
