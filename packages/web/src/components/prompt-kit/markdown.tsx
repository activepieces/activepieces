import { t } from 'i18next';
import { Check, Copy } from 'lucide-react';
import { marked } from 'marked';
import { memo, useCallback, useId, useMemo, useState } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

import { CodeBlock, CodeBlockCode, CodeBlockGroup } from './code-block';
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

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  children?: HastNode[];
};

function isLinkOnlyItem(node: HastNode): boolean {
  const significant =
    node.children?.filter((c) => !(c.type === 'text' && !c.value?.trim())) ??
    [];
  if (significant.length !== 1) return false;
  const first = significant[0];
  if (first.type === 'element' && first.tagName === 'a') return true;
  if (first.type === 'element' && first.tagName === 'p') {
    const pChildren =
      first.children?.filter((c) => !(c.type === 'text' && !c.value?.trim())) ??
      [];
    return (
      pChildren.length === 1 &&
      pChildren[0].type === 'element' &&
      pChildren[0].tagName === 'a'
    );
  }
  return false;
}

function isLinkOnlyList(node: HastNode | undefined): boolean {
  if (!node?.children) return false;
  const items = node.children.filter(
    (c) => c.type === 'element' && c.tagName === 'li',
  );
  return items.length > 0 && items.every(isLinkOnlyItem);
}

function CodeCopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
      title={t('Copy')}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

const INITIAL_COMPONENTS: Partial<Components> = {
  ul: function UlComponent({ children, node }) {
    if (isLinkOnlyList(node as HastNode | undefined)) {
      return <div className="flex flex-wrap gap-1.5 my-2">{children}</div>;
    }
    return <ul>{children}</ul>;
  },
  ol: function OlComponent({ children, node }) {
    if (isLinkOnlyList(node as HastNode | undefined)) {
      return <div className="flex flex-wrap gap-1.5 my-2">{children}</div>;
    }
    return <ol>{children}</ol>;
  },
  li: function LiComponent({ children, node }) {
    if (node && isLinkOnlyItem(node as HastNode)) {
      return <>{children}</>;
    }
    return <li>{children}</li>;
  },
  a: function LinkComponent({ href, children, node }) {
    if (!href) return <>{children}</>;
    const isWebUrl = href.startsWith('http://') || href.startsWith('https://');
    const isSafeProtocol =
      isWebUrl || href.startsWith('mailto:') || href.startsWith('tel:');
    if (!isSafeProtocol) {
      return <span>{children}</span>;
    }
    if (!isWebUrl) {
      return (
        <a
          href={href}
          className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
        >
          {children}
        </a>
      );
    }
    const text = typeof children === 'string' ? children : '';

    const isInListItem =
      node?.position?.start.column && node.position.start.column > 1;
    const isStandaloneLink = !isInListItem && text.startsWith('http');

    if (isStandaloneLink || isInListItem) {
      return <Source href={href} title={text !== href ? text : undefined} />;
    }

    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
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
    const code = children as string;

    return (
      <CodeBlock className={className}>
        <CodeBlockGroup className="border-b px-3 py-1.5">
          <span className="text-xs text-muted-foreground font-mono">
            {language !== 'plaintext' ? language : ''}
          </span>
          <CodeCopyButton code={code} />
        </CodeBlockGroup>
        <CodeBlockCode code={code} language={language} />
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
