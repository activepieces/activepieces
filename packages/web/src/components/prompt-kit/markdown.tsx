import { marked } from 'marked';
import { memo, useId, useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

import { CodeBlock, CodeBlockCode } from './code-block';
import { Source } from './source';

export type MarkdownProps = {
  children: string;
  id?: string;
  className?: string;
  components?: Partial<Components>;
};

function normalizeMarkdownSpacing(markdown: string): string {
  let text = markdown;

  // Ensure headings have a newline before them (fixes "text.## Heading" streaming artifact)
  text = text.replace(/([^\n])(#{1,6}\s)/g, '$1\n\n$2');

  // Ensure blank lines between non-empty content lines (except inside tables/code/lists)
  const lines = text.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    // Preserve tables and lists as-is
    if (
      trimmed.startsWith('|') ||
      /^\s*[-*+]\s/.test(trimmed) ||
      /^\s*\d+[.)]\s/.test(trimmed)
    ) {
      result.push(line);
      continue;
    }

    // Add blank line before non-empty content if previous line was also non-empty
    const prevLine = result[result.length - 1]?.trim() ?? '';
    const prevIsTableOrList =
      prevLine.startsWith('|') ||
      /^\s*[-*+]\s/.test(prevLine) ||
      /^\s*\d+[.)]\s/.test(prevLine);

    if (i > 0 && prevLine !== '' && trimmed !== '' && !prevIsTableOrList) {
      result.push('');
    }

    result.push(line);
  }

  return result.join('\n');
}

function parseMarkdownIntoBlocks(markdown: string): string[] {
  const normalized = normalizeMarkdownSpacing(markdown);
  const tokens = marked.lexer(normalized);
  return tokens.map((token) => token.raw);
}

function extractLanguage(className?: string): string {
  if (!className) return 'plaintext';
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : 'plaintext';
}

const INITIAL_COMPONENTS: Partial<Components> = {
  a: function LinkComponent({ href, children }) {
    if (!href) return <>{children}</>;
    const text = typeof children === 'string' ? children : '';
    return <Source href={href} title={text || undefined} />;
  },
  code: function CodeComponent({ className, children, ...props }) {
    const isInline =
      !props.node?.position?.start.line ||
      props.node?.position?.start.line === props.node?.position?.end.line;

    if (isInline) {
      return (
        <span
          className={cn(
            'bg-primary-foreground rounded-sm px-1 font-mono text-sm',
            className,
          )}
          {...props}
        >
          {children}
        </span>
      );
    }

    const language = extractLanguage(className);

    return (
      <CodeBlock className={className}>
        <CodeBlockCode code={children as string} language={language} />
      </CodeBlock>
    );
  },
  pre: function PreComponent({ children }) {
    return <>{children}</>;
  },
};

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({
    content,
    components = INITIAL_COMPONENTS,
  }: {
    content: string;
    components?: Partial<Components>;
  }) {
    return (
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    );
  },
  function propsAreEqual(prevProps, nextProps) {
    return prevProps.content === nextProps.content;
  },
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

function MarkdownComponent({
  children,
  id,
  className,
  components = INITIAL_COMPONENTS,
}: MarkdownProps) {
  const generatedId = useId();
  const blockId = id ?? generatedId;
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children]);

  return (
    <div
      className={cn(
        '[&_pre]:overflow-x-auto [&_pre]:max-w-full',
        '[&_table]:w-full [&_table]:text-sm [&_table]:border-collapse [&_table]:my-4',
        '[&_th]:text-left [&_th]:p-2.5 [&_th]:border-b [&_th]:border-border [&_th]:font-semibold',
        '[&_td]:p-2.5 [&_td]:border-b [&_td]:border-border',
        className,
      )}
    >
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock
          key={`${blockId}-block-${index}`}
          content={block}
          components={components}
        />
      ))}
    </div>
  );
}

const Markdown = memo(MarkdownComponent);
Markdown.displayName = 'Markdown';

export { Markdown };
