import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { Check, Copy, Info, AlertTriangle, Lightbulb } from 'lucide-react';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';

import { cn } from '@/lib/utils';
import { MarkdownVariant } from '@activepieces/shared';

import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
function applyVariables(markdown: string, variables: Record<string, string>) {
  return markdown
    .replaceAll('<br>', '\n')
    .replaceAll(/\{\{(.*?)\}\}/g, (_, variableName) => {
      return variables[variableName] ?? '';
    });
}

type MarkdownProps = {
  markdown: string | undefined;
  variables?: Record<string, string>;
  variant?: MarkdownVariant;
};

const Container = ({
  variant,
  children,
}: {
  variant?: MarkdownVariant;
  children: React.ReactNode;
}) => {
  return (
    <Alert
      className={cn('rounded-md border', {
        'bg-warning-100 text-warning-300 border-none':
          variant === MarkdownVariant.WARNING,
        'bg-success-100 text-success-300 border-none':
          variant === MarkdownVariant.TIP,
        'p-0 bg-background border-none': variant === MarkdownVariant.BORDERLESS,
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
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
};

const ApMarkdown = React.memo(
  ({ markdown, variables, variant }: MarkdownProps) => {
    const [copiedText, setCopiedText] = useState<string | null>(null);
    const { toast } = useToast();

    const { mutate: copyToClipboard } = useMutation({
      mutationFn: async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedText(text);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setCopiedText(null);
      },
      onError: () => {
        toast({
          title: t('Failed to copy to clipboard'),
          duration: 3000,
        });
      },
    });

    if (!markdown) {
      return null;
    }
    const markdownProcessed = applyVariables(markdown, variables ?? {})
      .split('\n')
      .map((line) => line.trim())
      .join('\n');
    return (
      <Container variant={variant}>
        <ReactMarkdown
          remarkPlugins={[gfm]}
          components={{
            code(props) {
              const isLanguageText = props.className?.includes('language-text');
              if (!isLanguageText) {
                return <code {...props} className="text-wrap" />;
              }
              const codeContent = String(props.children).trim();
              const isCopying = codeContent === copiedText;
              return (
                <div className="relative w-full items-center flex bg-background border border-solid text-sm rounded block w-full gap-1 p-1.5">
                  <input
                    type="text"
                    className="grow bg-background"
                    value={codeContent}
                    disabled
                  />
                  <Button
                    variant="ghost"
                    className="bg-background rounded p-2 inline-flex items-center justify-center h-8"
                    onClick={() => copyToClipboard(codeContent)}
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
                className="scroll-m-20 text-2xl font-extrabold tracking-tight lg:text-5xl"
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                className="scroll-m-20 text-xl text-3xl font-semibold tracking-tight first:mt-0"
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
                className="leading-7 [&:not(:first-child)]:mt-4 w-full"
                {...props}
              />
            ),
            ul: ({ node, ...props }) => (
              <ul className="mt-4 ml-6 list-disc [&>li]:mt-4" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="mt-4 ml-6 list-decimal [&>li]:mt-4" {...props} />
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
            b: ({ node, ...props }) => <b {...props} />,
            em: ({ node, ...props }) => <em {...props} />,
          }}
        >
          {markdownProcessed.trim()}
        </ReactMarkdown>
      </Container>
    );
  },
);

ApMarkdown.displayName = 'ApMarkdown';
export { ApMarkdown };
