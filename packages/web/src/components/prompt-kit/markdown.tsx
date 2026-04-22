import { marked } from 'marked';
import { memo, useId, useMemo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

import { CodeBlock, CodeBlockCode } from './code-block';

export type MarkdownProps = {
  children: string;
  id?: string;
  className?: string;
  components?: Partial<Components>;
};

function normalizeMarkdownSpacing(markdown: string): string {
  return markdown
    .replace(/\n(?!\n)/g, (match, offset, str) => {
      const before = str.slice(Math.max(0, offset - 3), offset);
      if (/[|`-]/.test(before)) return match;
      if (/^\s*[-*+\d.]/.test(str.slice(offset + 1, offset + 10))) return match;
      return '\n\n';
    });
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
  a: function LinkComponent({ href, children, ...props }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
        {...props}
      >
        {children}
      </a>
    );
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
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={components}
      >
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
