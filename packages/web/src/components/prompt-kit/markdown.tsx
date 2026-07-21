import { marked } from 'marked';
import React, { memo, useId, useMemo } from 'react';
import ReactMarkdown, { Components, Options } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { cn } from '@/lib/utils';

import { CodeBlock, CodeBlockCode, CodeBlockGroup } from './code-block';
import { Source } from './source';

function normalizeMarkdownSpacing(markdown: string): string {
  let text = markdown;

  // Ensure headings have a blank line before them (fixes "text\n## Heading" streaming artifact).
  // Uses multiline flag so ^ matches after every \n; only touches lines that start with #.
  text = text.replace(/^(#{1,6}\s)/gm, '\n$1');

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
  return tokens
    .map((token) => token.raw)
    .filter((block) => block.trim().length > 0);
}

function extractLanguage(className?: string): string {
  if (!className) return 'plaintext';
  const match = className.match(/language-(\w+)/);
  return match ? match[1] : 'plaintext';
}

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

function hasTextContent(children: React.ReactNode): boolean {
  if (typeof children === 'string') return children.trim().length > 0;
  if (Array.isArray(children)) return children.some(hasTextContent);
  if (React.isValidElement(children)) {
    return hasTextContent(
      (children.props as { children?: React.ReactNode }).children,
    );
  }
  return Boolean(children);
}

function makeHeading(Tag: HeadingTag) {
  const Component = function ({ children }: { children?: React.ReactNode }) {
    if (!hasTextContent(children)) return null;
    return <Tag className={HEADING_CLASSES[Tag]}>{children}</Tag>;
  };
  Component.displayName = Tag.toUpperCase();
  return Component;
}

function MarkdownComponent({
  children,
  id,
  className,
  components = INITIAL_COMPONENTS,
  isAnimating,
  rehypePlugins,
}: MarkdownProps) {
  const generatedId = useId();
  const blockId = id ?? generatedId;
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children]);

  // While the message is actively streaming, each top-level block fades in once
  // as it mounts (`data-stream-animate` drives the CSS in styles.css). Because
  // completed blocks are content-memoized, an already-mounted block never
  // re-renders/replays — only genuinely-new blocks animate, so there's no
  // flicker or re-stream. Historical/settled messages pass isAnimating=false
  // and render fully static.
  return (
    <div
      data-stream-animate={isAnimating ? '' : undefined}
      className={cn(
        'chat-md text-sm leading-relaxed',
        '[&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
        '[&_li>p]:my-0 [&_li_ul]:my-1.5 [&_li_ol]:my-1.5',
        '[&_pre]:overflow-x-auto [&_pre]:max-w-full',
        '[&_th]:text-left [&_th]:p-2.5 [&_th]:border-b [&_th]:border-border [&_th]:font-semibold',
        '[&_td]:p-2.5 [&_td]:border-b [&_td]:border-border',
        '[&_tr:last-child_td]:border-b-0',
        className,
      )}
    >
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock
          key={`${blockId}-block-${index}`}
          content={block}
          components={components}
          rehypePlugins={rehypePlugins}
        />
      ))}
    </div>
  );
}

const MemoizedMarkdownBlock = memo(
  function MarkdownBlock({
    content,
    components = INITIAL_COMPONENTS,
    rehypePlugins,
  }: {
    content: string;
    components?: Partial<Components>;
    rehypePlugins?: Options['rehypePlugins'];
  }) {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    );
  },
  function propsAreEqual(prevProps, nextProps) {
    return (
      prevProps.content === nextProps.content &&
      prevProps.rehypePlugins === nextProps.rehypePlugins
    );
  },
);

MemoizedMarkdownBlock.displayName = 'MemoizedMarkdownBlock';

const Markdown = memo(MarkdownComponent);
Markdown.displayName = 'Markdown';

const HEADING_CLASSES: Record<HeadingTag, string> = {
  h1: 'text-lg font-semibold tracking-tight mt-6 first:mt-0 mb-3',
  h2: 'text-base font-semibold tracking-tight mt-5 first:mt-0 mb-2',
  h3: 'text-sm font-semibold mt-4 first:mt-0 mb-2',
  h4: 'text-sm font-semibold mt-4 first:mt-0 mb-1',
  h5: 'text-sm font-semibold text-muted-foreground mt-3 first:mt-0 mb-1',
  h6: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground mt-3 first:mt-0 mb-1',
};

const INITIAL_COMPONENTS: Partial<Components> = {
  table: function TableComponent({ children }) {
    return (
      <div className="my-4 overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm border-collapse">{children}</table>
      </div>
    );
  },
  h1: makeHeading('h1'),
  h2: makeHeading('h2'),
  h3: makeHeading('h3'),
  h4: makeHeading('h4'),
  h5: makeHeading('h5'),
  h6: makeHeading('h6'),
  p: function ParagraphComponent({ children }) {
    return (
      <p className="leading-relaxed my-4 first:mt-0 last:mb-0">{children}</p>
    );
  },
  strong: function StrongComponent({ children }) {
    return <strong className="font-semibold">{children}</strong>;
  },
  blockquote: function BlockquoteComponent({ children }) {
    return (
      <blockquote className="border-l-2 border-border pl-4 my-4 text-muted-foreground italic">
        {children}
      </blockquote>
    );
  },
  ul: function UlComponent({ children, node }) {
    if (isLinkOnlyList(node as HastNode | undefined)) {
      return <div className="flex flex-wrap gap-1.5 my-2">{children}</div>;
    }
    return (
      <ul className="list-disc pl-6 my-4 space-y-1.5 marker:text-muted-foreground">
        {children}
      </ul>
    );
  },
  ol: function OlComponent({ children, node }) {
    if (isLinkOnlyList(node as HastNode | undefined)) {
      return <div className="flex flex-wrap gap-1.5 my-2">{children}</div>;
    }
    return (
      <ol className="list-decimal pl-6 my-4 space-y-1.5 marker:text-muted-foreground">
        {children}
      </ol>
    );
  },
  li: function LiComponent({ children, node }) {
    if (node && isLinkOnlyItem(node as HastNode)) {
      return <>{children}</>;
    }
    return <li className="pl-1 leading-relaxed">{children}</li>;
  },
  a: function LinkComponent({ href, children }) {
    if (!href) return <>{children}</>;
    const isWebUrl = href.startsWith('http://') || href.startsWith('https://');
    const isSafeProtocol =
      isWebUrl || href.startsWith('mailto:') || href.startsWith('tel:');
    if (!isSafeProtocol) {
      return <span>{children}</span>;
    }

    const text = typeof children === 'string' ? children : '';
    const isBareUrl =
      isWebUrl && (text === '' || text === href || text.startsWith('http'));

    if (isBareUrl) {
      return <Source href={href} />;
    }

    return (
      <a
        href={href}
        target={isWebUrl ? '_blank' : undefined}
        rel={isWebUrl ? 'noopener noreferrer' : undefined}
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
            'bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-[0.85em]',
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
          <CopyButton
            textToCopy={code}
            withoutTooltip
            variant="ghost"
            className="h-6 w-6 p-0"
          />
        </CodeBlockGroup>
        <CodeBlockCode code={code} language={language} />
      </CodeBlock>
    );
  },
  hr: function HrComponent() {
    return <hr className="my-6 border-t border-border/60" />;
  },
  img: function ImgComponent({ src, alt }) {
    if (!src) return null;
    return (
      <img
        src={src}
        alt={alt ?? ''}
        className="my-4 max-w-full rounded-lg border border-border"
      />
    );
  },
  pre: function PreComponent({ children }) {
    return <>{children}</>;
  },
};

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  children?: HastNode[];
};

export type MarkdownProps = {
  children: string;
  id?: string;
  className?: string;
  components?: Partial<Components>;
  isAnimating?: boolean;
  rehypePlugins?: Options['rehypePlugins'];
};

export { Markdown, INITIAL_COMPONENTS, extractLanguage };
