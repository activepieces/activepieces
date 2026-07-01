import React from 'react';
import { Components } from 'react-markdown';

import {
  INITIAL_COMPONENTS,
  extractLanguage,
} from '@/components/prompt-kit/markdown';

import { CodeFilePreview } from './code-file-preview';
import { DocumentPreview } from './document-preview';
import { EmailGroup } from './email-group';
import { EmailPreview } from './email-preview';
import { HtmlPreview } from './html-preview';
import { JsonPreview } from './json-preview';
import { PieceTagInline } from './piece-tag';
import { previewUtils, HastNode } from './preview-utils';
import { SpreadsheetPreview } from './spreadsheet-preview';
import { SvgPreview } from './svg-preview';

const DefaultCode = INITIAL_COMPONENTS.code as
  | React.ComponentType<MarkdownCodeProps>
  | undefined;
const DefaultTable = INITIAL_COMPONENTS.table as
  | React.ComponentType<MarkdownTableProps>
  | undefined;

function isInlineCode(node: HastNode | undefined): boolean {
  const position = node?.position;
  return !position || position.start.line === position.end.line;
}

function PreviewCode(props: MarkdownCodeProps) {
  const { className, children, node } = props;

  if (isInlineCode(node) || !DefaultCode) {
    return DefaultCode ? <DefaultCode {...props} /> : <code>{children}</code>;
  }

  const language = extractLanguage(className);
  const code = typeof children === 'string' ? children : String(children ?? '');
  const fallback = <DefaultCode {...props} />;
  const kind = previewUtils.detectPreviewKind(language, code);

  switch (kind) {
    case 'html':
      return <HtmlPreview html={code} />;
    case 'svg':
      return <SvgPreview svg={code} />;
    case 'email':
      return <EmailPreview content={code} />;
    case 'csv': {
      const table = previewUtils.parseCsv(code);
      return table ? <SpreadsheetPreview table={table} /> : fallback;
    }
    case 'json': {
      const parsed = previewUtils.parseJsonSafe(code);
      return parsed.ok ? <JsonPreview data={parsed.value} /> : fallback;
    }
    case 'markdown':
      return <DocumentPreview markdown={code} />;
    default:
      return <CodeFilePreview code={code} language={language} />;
  }
}

function PreviewTable(props: MarkdownTableProps) {
  const table = previewUtils.extractTableFromNode(props.node);
  if (table && table.headers.length > 0) {
    return <SpreadsheetPreview table={table} />;
  }
  if (!DefaultTable) {
    return <table>{props.children}</table>;
  }
  return <DefaultTable {...props} />;
}

export const markdownPreviewComponents: Partial<Components> = {
  ...INITIAL_COMPONENTS,
  code: PreviewCode as Components['code'],
  table: PreviewTable as Components['table'],
  data: PieceTagInline,
  section: EmailGroup,
};

type MarkdownCodeProps = {
  className?: string;
  children?: React.ReactNode;
  node?: HastNode;
};

type MarkdownTableProps = {
  children?: React.ReactNode;
  node?: HastNode;
};
