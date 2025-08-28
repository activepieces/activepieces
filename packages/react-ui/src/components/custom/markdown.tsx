import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, Copy, Info, AlertTriangle, Lightbulb } from 'lucide-react';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
// @ts-ignore - unified types are included in the unified package
import type { Pluggable } from 'unified';
import breaks from 'remark-breaks';
import gfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { MarkdownVariant } from '@activepieces/shared';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';

type CodeProps = {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any; // Allow additional props
};


function applyVariables(markdown: string, variables: Record<string, string>) {
  if (typeof markdown !== 'string') {
    return '';
  }
  let result = markdown.split('<br>').join('\n');
  result = result.replace(/\{\{(.*?)\}\}/g, (_, variableName) => {
    return variables[variableName] ?? '';
  });
  return result;
}

type MarkdownProps = {
  markdown: string | undefined;
  variables?: Record<string, string>;
  variant?: MarkdownVariant;
  className?: string;
  loading?: string;
};

interface ContainerProps {
  variant?: MarkdownVariant;
  children: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({
  variant,
  children,
}) => {
  return (
    <Alert
      className={cn('rounded-md border', {
        'bg-warning-100 text-warning-300 border-none':
          variant === MarkdownVariant.WARNING,
        'bg-success-100 text-success-300 border-none':
          variant === MarkdownVariant.TIP,
        'p-0 bg-transparent border-none':
          variant === MarkdownVariant.BORDERLESS,
      })}
    >
      {variant !== MarkdownVariant.BORDERLESS && (
        <>
          {(variant === MarkdownVariant.INFO || variant === undefined) && (
            <Info className="w-4 h-4 mt-1" />
          )}
          {variant === MarkdownVariant.WARNING && (
            <AlertTriangle className="w-4 h-4 mt-1" />
          )}
          {variant === MarkdownVariant.TIP && (
            <Lightbulb className="w-4 h-4 mt-1" />
          )}
        </>
      )}
      <AlertDescription className="flex-grow w-full">
        {children}
      </AlertDescription>
    </Alert>
  );
};

const ApMarkdown = React.memo<MarkdownProps>(({ markdown, variables, variant, className, loading }) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const { toast } = useToast();

  const { mutateAsync: copyToClipboard } = useMutation({
    mutationFn: async (text: string) => {
      return navigator.clipboard.writeText(text);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: t('error.failed_to_copy'),
      });
    },
  });

    if (loading && loading.length > 0) {
      return (
        <Container variant={variant}>
          <div className="flex items-center gap-2">{loading}</div>
        </Container>
      );
    }

    if (!markdown) {
      return null;
    }

    const markdownProcessed = applyVariables(markdown, variables ?? {});

    return (
      <Container variant={variant}>
        <div className={cn('flex-grow w-full', className)}>
          <ReactMarkdown
            // @ts-ignore - The types are correct but there's a version mismatch
            remarkPlugins={[gfm, breaks]}
            components={{
            code: ({
              node,
              inline = false,
              className: codeClassName,
              children,
              ...props
            }: CodeProps) => {
              if (inline || !children) {
                return (
                  <code className={cn('text-wrap', codeClassName)} {...props}>
                    {children}
                  </code>
                );
              }

              const isLanguageText = codeClassName?.includes('language-text');
              if (!isLanguageText) {
                return (
                  <code className={cn('text-wrap', codeClassName)} {...props}>
                    {children}
                  </code>
                );
              }
              const codeContent = String(children).trim();
              const isCopying = codeContent === copiedText;
              
              const handleCopy = async () => {
                try {
                  await copyToClipboard(codeContent);
                  setCopiedText(codeContent);
                  setTimeout(() => setCopiedText(null), 2000);
                } catch (error) {
                  console.error('Failed to copy text: ', error);
                }
              };
              return (
                <div className="relative w-full flex items-center bg-background border border-solid text-sm rounded gap-1 p-1.5">
                  <input
                    type="text"
                    className="grow bg-background"
                    value={codeContent}
                    disabled
                    readOnly
                  />
                  <Button
                    variant="ghost"
                    className="bg-background rounded p-2 inline-flex items-center justify-center h-8"
                    onClick={handleCopy}
                  >
                    {isCopying ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              );
            },
            h1: ({ node, ...props }) => (
              <h1
                className="scroll-m-20 text-xl font-extrabold tracking-tight lg:text-3xl"
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                className="scroll-m-20 text-xl font-semibold tracking-tight first:mt-0"
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                className="scroll-m-20 text-lg font-semibold tracking-tight"
                {...props}
              />
            ),
            p: ({ node, ...props }) => (
              <p
                className="leading-7 [&:not(:first-child)]:mt-2 w-full"
                {...props}
              />
            ),
            ul: ({ node, ...props }) => (
              <ul className="mt-4 ml-6 list-disc [&>li]:mt-2" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="mt-4 ml-6 list-decimal [&>li]:mt-2" {...props} />
            ),
            li: ({ node, ...props }) => <li {...props} />,
            a: ({ node, ...props }) => (
              <a
                className="font-medium text-primary underline underline-offset-4"
                target="_blank"
                rel="noreferrer noopener"
                {...props}
              />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="mt-4 first:mt-0 border-l-2 pl-6 italic"
                {...props}
              />
            ),
            hr: ({ node, ...props }) => (
              <hr className="my-4 border-t border-border/50" {...props} />
            ),
            img: ({ node, ...props }) => (
              <img className="my-8" {...props} />
            ),
            b: ({ node, ...props }) => <b {...props} />,
            em: ({ node, ...props }) => <em {...props} />,
            table: ({ node, ...props }) => (
              <table className="w-full my-4 border-collapse" {...props} />
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-muted" {...props} />
            ),
            tr: ({ node, ...props }) => (
              <tr className="border-b border-border" {...props} />
            ),
            th: ({ node, ...props }) => (
              <th className="text-left p-2 font-medium" {...props} />
            ),
            td: ({ node, ...props }) => (
              <td className="p-2" {...props} />
            ),
          }}
        >
            {markdownProcessed.trim()}
          </ReactMarkdown>
        </div>
      </Container>
    );
  });

ApMarkdown.displayName = 'ApMarkdown';
export { ApMarkdown };
