import { tryCatchSync } from '@activepieces/core-utils';
import { PopulatedMcpActivity } from '@activepieces/shared';
import { t } from 'i18next';

import { formatUtils } from '@/lib/format-utils';

function formatRan({
  row,
  actionDisplayName,
  pieceDisplayName,
}: FormatRanParams): Ran {
  return {
    action:
      actionDisplayName ??
      (row.actionName === null
        ? t('Unknown action')
        : formatUtils.convertEnumToHumanReadable(row.actionName)),
    piece: pieceDisplayName ?? row.pieceName,
  };
}

function formatAccount(row: PopulatedMcpActivity): string | null {
  return row.connectionDisplayName ?? row.connectionExternalId;
}

function parseOutput(output: unknown): ParsedOutput {
  const text = toolResultText(output);
  if (text === null) {
    return { summary: null, data: output ?? null };
  }
  const [firstParagraph, ...rest] = text.split(/\n\s*\n/);
  const remainder = rest.join('\n\n').trim();
  return {
    summary: stripStatusMark(firstParagraph.trim()),
    data: remainder.length === 0 ? null : parseJsonOrText(remainder),
  };
}

function actionInput(input: unknown): unknown {
  if (isRecord(input) && 'pieceName' in input && 'actionName' in input) {
    return input.input ?? null;
  }
  return input ?? null;
}

function errorText(errorMessage: string): string {
  return errorMessage
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(
      (paragraph) =>
        paragraph.length > 0 && !paragraph.startsWith('Retry suggestion:'),
    )
    .map((paragraph, index) =>
      index === 0 ? stripStatusMark(paragraph) : paragraph,
    )
    .join('\n\n');
}

function memberName(member: MemberNameParts): string {
  return `${member.firstName} ${member.lastName}`.trim() || member.email;
}

function resolveSelection({
  selection,
  rows,
  cursor,
  isPlaceholderData,
}: ResolveSelectionParams): PopulatedMcpActivity | null {
  if (selection === null) {
    return null;
  }
  const { pending } = selection;
  const landed =
    pending !== undefined &&
    pending.cursor === cursor &&
    !isPlaceholderData &&
    rows.length > 0;
  if (!landed) {
    return selection.row;
  }
  return pending.edge === 'first' ? rows[0] : rows[rows.length - 1];
}

function toolResultText(output: unknown): string | null {
  if (!Array.isArray(output) || output.length === 0) {
    return null;
  }
  const texts = output.map((part) =>
    isRecord(part) && part.type === 'text' && typeof part.text === 'string'
      ? part.text
      : null,
  );
  if (texts.some((text) => text === null)) {
    return null;
  }
  return texts.join('\n\n');
}

function parseJsonOrText(value: string): unknown {
  const { data, error } = tryCatchSync<unknown>(() => JSON.parse(value));
  return error === null ? data : value;
}

function stripStatusMark(value: string): string {
  return value.replace(/^(✅|❌|⏳)\s*/u, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const activityUtils = {
  formatRan,
  formatAccount,
  parseOutput,
  actionInput,
  errorText,
  memberName,
  resolveSelection,
};

export type Ran = {
  action: string;
  piece: string | null;
};

type FormatRanParams = {
  row: PopulatedMcpActivity;
  actionDisplayName: string | undefined;
  pieceDisplayName: string | undefined;
};

export type ParsedOutput = {
  summary: string | null;
  data: unknown;
};

export type ActivitySelection = {
  row: PopulatedMcpActivity;
  pending?: { cursor: string; edge: 'first' | 'last' };
};

type MemberNameParts = {
  firstName: string;
  lastName: string;
  email: string;
};

type ResolveSelectionParams = {
  selection: ActivitySelection | null;
  rows: PopulatedMcpActivity[];
  cursor: string | undefined;
  isPlaceholderData: boolean;
};
