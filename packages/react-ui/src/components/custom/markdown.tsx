import { useMutation } from '@tanstack/react-query';
import { Check, Copy } from 'lucide-react';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { t } from 'i18next';

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
  className?: string;
  withBorder?: boolean;
};

const ApMarkdown = React.memo(
  ({ markdown, variables, withBorder = true }: MarkdownProps) => {
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

    const Container = ({ children }: { children: React.ReactNode }) =>
      withBorder ? (
        <Alert>
          <AlertDescription>{children}</AlertDescription>
        </Alert>
      ) : (
        children
      );

    if (!markdown) {
      return null;
    }

    const markdownProcessed = applyVariables(markdown, variables ?? {});
    return (
      <Container>
        <ReactMarkdown
          components={{
            code(props) {
              const isLanguageText = props.className?.includes('language-text');
              if (!isLanguageText) {
                return <code {...props} className="text-wrap" />;
              }
              const codeContent = String(props.children).trim();
              const isCopying = codeContent === copiedText;
              return (
                <div className="relative py-2">
                  <input
                    type="text"
                    className="col-span-6 bg-background border border-solid text-sm rounded-lg block w-full p-2.5"
                    value={codeContent}
                    disabled
                  />
                  <Button
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background rounded-lg p-2 inline-flex items-center justify-center"
                    onClick={() => copyToClipboard(codeContent)}
                  >
                    {isCopying ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              );
            },
            h1: ({ node, ...props }) => (
              <h1
                className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl"
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0"
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                className="scroll-m-20 text-2xl font-semibold tracking-tight"
                {...props}
              />
            ),
            p: ({ node, ...props }) => (
              <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />
            ),
            li: ({ node, ...props }) => <li {...props} />,
            a: ({ node, ...props }) => (
              <a
                className="font-medium text-primary underline underline-offset-4"
                {...props}
              />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote className="mt-6 border-l-2 pl-6 italic" {...props} />
            ),
          }}
        >
          {markdownProcessed}
        </ReactMarkdown>
      </Container>
    );
  },
);

ApMarkdown.displayName = 'ApMarkdown';
export { ApMarkdown };