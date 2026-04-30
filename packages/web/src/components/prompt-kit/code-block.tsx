import React, { useEffect, useState } from 'react';
import {
  bundledLanguages,
  codeToTokens,
  type BundledLanguage,
  type ThemedToken,
} from 'shiki';

import { cn } from '@/lib/utils';

function CodeBlock({ children, className, ...props }: CodeBlockProps) {
  return (
    <div
      className={cn(
        'not-prose flex w-full flex-col overflow-clip border',
        'border-border bg-card text-card-foreground rounded-xl',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function CodeBlockCode({
  code,
  language = 'tsx',
  theme,
  className,
  ...props
}: CodeBlockCodeProps) {
  const [tokenResult, setTokenResult] = useState<TokenResult | null>(null);

  useEffect(() => {
    if (!code) {
      setTokenResult(null);
      return;
    }

    let cancelled = false;

    async function highlight() {
      const themeOptions = theme
        ? { theme }
        : {
            themes: { light: 'vitesse-light', dark: 'vitesse-dark' },
            defaultColor: false as const,
          };

      const lang = isBundledLanguage(language) ? language : 'plaintext';

      let result;
      try {
        result = await codeToTokens(code, { lang, ...themeOptions });
      } catch {
        if (lang === 'plaintext') return;
        try {
          result = await codeToTokens(code, {
            lang: 'plaintext',
            ...themeOptions,
          });
        } catch {
          return;
        }
      }

      if (cancelled) return;

      setTokenResult({
        lines: result.tokens.map((line) =>
          line.map((token) => ({
            content: token.content,
            style: getTokenStyle(token),
          })),
        ),
        preStyle:
          typeof result.rootStyle === 'string'
            ? parseCssProperties(result.rootStyle)
            : {},
      });
    }

    highlight();
    return () => {
      cancelled = true;
    };
  }, [code, language, theme]);

  const classNames = cn(
    'w-full overflow-x-auto text-[13px] [&>pre]:px-4 [&>pre]:py-4',
    className,
  );

  if (!tokenResult) {
    return (
      <div className={classNames} {...props}>
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  const lastLineIndex = tokenResult.lines.length - 1;

  return (
    <div className={classNames} {...props}>
      <pre className="shiki" style={tokenResult.preStyle}>
        <code>
          {tokenResult.lines.map((line, lineIndex) => (
            <span key={lineIndex} className="line">
              {line.map((token, tokenIndex) => (
                <span key={tokenIndex} style={token.style}>
                  {token.content}
                </span>
              ))}
              {lineIndex < lastLineIndex ? '\n' : ''}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

function CodeBlockGroup({
  children,
  className,
  ...props
}: CodeBlockGroupProps) {
  return (
    <div
      className={cn('flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}

const EMPTY_STYLE: React.CSSProperties = {};

function getTokenStyle(token: ThemedToken): React.CSSProperties {
  if (token.htmlStyle) {
    const style: React.CSSProperties = {};
    Object.assign(style, token.htmlStyle);
    return style;
  }
  if (token.color) {
    return { color: token.color };
  }
  return EMPTY_STYLE;
}

function parseCssProperties(cssString: string): React.CSSProperties {
  const style: React.CSSProperties = {};
  for (const part of cssString.split(';')) {
    const colonIndex = part.indexOf(':');
    if (colonIndex === -1) continue;
    const key = part.slice(0, colonIndex).trim();
    const value = part.slice(colonIndex + 1).trim();
    if (key && value) {
      Object.assign(style, { [key]: value });
    }
  }
  return style;
}

function isBundledLanguage(lang: string): lang is BundledLanguage {
  return lang in bundledLanguages;
}

type PrecomputedToken = {
  content: string;
  style: React.CSSProperties;
};

type TokenResult = {
  lines: PrecomputedToken[][];
  preStyle: React.CSSProperties;
};

export type CodeBlockProps = {
  children?: React.ReactNode;
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

export type CodeBlockCodeProps = {
  code: string;
  language?: string;
  theme?: string;
  className?: string;
} & React.HTMLProps<HTMLDivElement>;

export type CodeBlockGroupProps = React.HTMLAttributes<HTMLDivElement>;

export { CodeBlockGroup, CodeBlockCode, CodeBlock };
