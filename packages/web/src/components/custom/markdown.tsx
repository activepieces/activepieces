import { MarkdownVariant } from '@activepieces/shared';
import {
  Alert02Icon,
  Copy01Icon,
  Idea01Icon,
  InformationCircleIcon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import breaks from 'remark-breaks';
import gfm from 'remark-gfm';
import { toast } from 'sonner';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { cn } from '@/lib/utils';

import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';

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
        'bg-warning-3 border-none text-warning-11':
          variant === MarkdownVariant.WARNING,
        'bg-success-3 text-success-11 border-none':
          variant === MarkdownVariant.TIP,
        'p-0 bg-transparent border-none':
          variant === MarkdownVariant.BORDERLESS,
      })}
    >
      {variant !== MarkdownVariant.BORDERLESS && (
        <>
          {(variant === MarkdownVariant.INFO || variant === undefined) && (
            <HugeiconsIcon
              icon={InformationCircleIcon}
              className="w-4 h-4 mt-1"
            />
          )}
          {variant === MarkdownVariant.WARNING && (
            <HugeiconsIcon
              icon={Alert02Icon}
              className="size-4 mt-1 text-warning-11"
            />
          )}
          {variant === MarkdownVariant.TIP && (
            <HugeiconsIcon icon={Idea01Icon} className="w-4 h-4 mt-1" />
          )}
        </>
      )}
      <AlertDescription className="grow w-full">{children}</AlertDescription>
    </Alert>
  );
};

const ApMarkdown = React.memo(
  ({ markdown, variables, variant, className, loading }: MarkdownProps) => {
    const [copiedText, setCopiedText] = useState<string | null>(null);

    const { mutate: copyToClipboard } = useMutation({
      mutationFn: async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedText(text);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setCopiedText(null);
      },
      onError: () => {
        toast.error(t('Failed to copy to clipboard'), {
          duration: 3000,
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
        <ReactMarkdown
          className={cn('grow w-full ', className)}
          remarkPlugins={[gfm, breaks]}
          components={{
            code({ node: _node, ref: _ref, ...props }) {
              const isLanguageText = props.className?.includes('language-text');
              if (!isLanguageText) {
                return <code {...props} className="text-wrap" />;
              }
              const codeContent = String(props.children).trim();
              const isCopying = codeContent === copiedText;
              return (
                <div className="relative w-full items-center flex bg-gray-1 border border-solid text-sm rounded block w-full gap-1 p-1.5">
                  <input
                    type="text"
                    className="grow bg-gray-1"
                    value={codeContent}
                    disabled
                  />
                  <Button
                    variant="ghost"
                    className="bg-gray-1 rounded p-2 inline-flex items-center justify-center h-8"
                    onClick={() => copyToClipboard(codeContent)}
                  >
                    {isCopying ? (
                      <HugeiconsIcon icon={Tick02Icon} className="w-3 h-3" />
                    ) : (
                      <HugeiconsIcon icon={Copy01Icon} className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              );
            },
            h1: ({ node: _node, ref: _ref, ...props }) => (
              <h1
                className="scroll-m-20 text-xl font-extrabold tracking-tight lg:text-3xl"
                {...props}
              />
            ),
            h2: ({ node: _node, ref: _ref, ...props }) => (
              <h2
                className="scroll-m-20 text-lg text-xl font-semibold tracking-tight first:mt-0"
                {...props}
              />
            ),
            h3: ({ node: _node, ref: _ref, ...props }) => (
              <h3
                className="scroll-m-20 text-lg font-semibold tracking-tight"
                {...props}
              />
            ),
            p: ({ node: _node, ref: _ref, ...props }) => (
              <p
                className="leading-5 first-of-type:mt-1 not-first-of-type:mt-2 w-full mb-2"
                {...props}
              />
            ),
            ul: ({ node: _node, ref: _ref, ...props }) => (
              <ul className="mt-4 ml-6 list-disc [&>li]:mt-2" {...props} />
            ),
            ol: ({ node: _node, ref: _ref, ...props }) => (
              <ol className="mt-4 ml-6 list-decimal [&>li]:mt-2" {...props} />
            ),
            li: ({ node: _node, ref: _ref, ...props }) => <li {...props} />,
            a: ({ node: _node, ref: _ref, ...props }) => (
              <a
                className="font-medium text-accent-11 underline underline-offset-4"
                target="_blank"
                rel="noreferrer noopener"
                {...props}
              />
            ),
            blockquote: ({ node: _node, ref: _ref, ...props }) => (
              <blockquote
                className="mt-4 first:mt-0 border-l-2 pl-6 italic"
                {...props}
              />
            ),
            hr: ({ node: _node, ref: _ref, ...props }) => (
              <hr className="my-4 border-t border-gray-6/50" {...props} />
            ),
            img: ({ node: _node, ref: _ref, ...props }) => (
              <img className="my-8" {...props} />
            ),
            b: ({ node: _node, ref: _ref, ...props }) => <b {...props} />,
            em: ({ node: _node, ref: _ref, ...props }) => <em {...props} />,
            table: ({ node: _node, ref: _ref, ...props }) => (
              <table className="w-full my-4 border-collapse" {...props} />
            ),
            thead: ({ node: _node, ref: _ref, ...props }) => (
              <thead className="bg-gray-3" {...props} />
            ),
            tr: ({ node: _node, ref: _ref, ...props }) => (
              <tr className="border-b border-gray-6" {...props} />
            ),
            th: ({ node: _node, ref: _ref, ...props }) => (
              <th className="text-left p-2 font-medium" {...props} />
            ),
            td: ({ node: _node, ref: _ref, ...props }) => (
              <td className="p-2" {...props} />
            ),
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
