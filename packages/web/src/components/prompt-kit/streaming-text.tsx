import { useEffect, useMemo, useRef, useState } from 'react';
import { type Components, type Options } from 'react-markdown';

import { Markdown } from './markdown';

export function StreamingText({
  text,
  components,
  className,
  rehypePlugins,
}: {
  text: string;
  components?: Partial<Components>;
  className?: string;
  rehypePlugins?: Options['rehypePlugins'];
}) {
  const wordEnds = useMemo(() => wordEndOffsets(text), [text]);
  const totalWords = wordEnds.length;

  const [revealedWords, setRevealedWords] = useState(0);
  const revealedRef = useRef(0);
  const targetRef = useRef(totalWords);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  targetRef.current = totalWords;

  useEffect(() => {
    function tick(now: number) {
      const target = targetRef.current;
      const current = revealedRef.current;
      if (current >= target) {
        rafRef.current = null;
        lastTickRef.current = null;
        return;
      }
      const last = lastTickRef.current ?? now;
      lastTickRef.current = now;
      const gap = target - current;
      let step = Math.max(1, Math.floor((now - last) / MS_PER_WORD));
      if (gap > CATCH_UP_THRESHOLD) {
        step = Math.max(step, Math.ceil(gap / CATCH_UP_DIVISOR));
      }
      const next = Math.min(current + step, target);
      revealedRef.current = next;
      setRevealedWords(next);
      rafRef.current = requestAnimationFrame(tick);
    }

    if (rafRef.current === null && revealedRef.current < targetRef.current) {
      lastTickRef.current = null;
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        lastTickRef.current = null;
      }
    };
  }, [totalWords]);

  const isFullyRevealed = revealedWords >= totalWords;
  const revealedText = isFullyRevealed
    ? text
    : text.slice(0, wordEnds[revealedWords - 1] ?? 0);
  // A multi-word marker (`{{app:Google Sheets}}`) can be revealed mid-token while
  // streaming (`…{{app:Google`); hide a trailing unclosed `{{…` until it completes
  // so the raw marker never flashes. Never applied once fully revealed.
  const visibleText = isFullyRevealed
    ? revealedText
    : revealedText.replace(/\{\{[^}]*$/, '');

  const mergedPlugins = useMemo(
    () => [...(rehypePlugins ?? []), rehypeWordFade],
    [rehypePlugins],
  );

  return (
    <Markdown
      className={className}
      components={components}
      rehypePlugins={mergedPlugins}
    >
      {visibleText}
    </Markdown>
  );
}

function wordEndOffsets(text: string): number[] {
  const ends: number[] = [];
  const wordWithTrailingSpace = /\S+\s*/g;
  let match: RegExpExecArray | null;
  while ((match = wordWithTrailingSpace.exec(text)) !== null) {
    ends.push(match.index + match[0].length);
  }
  return ends;
}

function splitTextNode(value: string): HastNode[] {
  return value
    .split(/(\s+)/)
    .filter((segment) => segment.length > 0)
    .map((segment) =>
      /^\s+$/.test(segment)
        ? { type: 'text', value: segment }
        : {
            type: 'element',
            tagName: 'span',
            properties: { className: ['chat-word'] },
            children: [{ type: 'text', value: segment }],
          },
    );
}

function wrapWords(node: HastNode, insideSkip: boolean): void {
  if (!node.children) {
    return;
  }
  node.children = node.children.flatMap((child) => {
    if (
      child.type === 'text' &&
      !insideSkip &&
      typeof child.value === 'string'
    ) {
      return splitTextNode(child.value);
    }
    if (child.type === 'element') {
      const skip =
        insideSkip || (child.tagName ? SKIP_TAGS.has(child.tagName) : false);
      wrapWords(child, skip);
    }
    return [child];
  });
}

function rehypeWordFade() {
  return (tree: HastNode) => wrapWords(tree, false);
}

const MS_PER_WORD = 22;
const CATCH_UP_THRESHOLD = 40;
const CATCH_UP_DIVISOR = 8;
const SKIP_TAGS = new Set(['code', 'pre', 'a', 'data']);

interface HastNode {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}
