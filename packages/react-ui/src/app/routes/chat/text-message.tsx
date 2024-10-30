import { javascript } from '@codemirror/lang-javascript';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import ReactCodeMirror, {
  EditorState,
  EditorView,
} from '@uiw/react-codemirror';
import { CodeIcon, Copy } from 'lucide-react';
import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { cn } from '@/lib/utils';
import { FileResponseInterface } from '@activepieces/shared';

interface TextMessageProps {
  content: string;
  role: 'user' | 'bot';
  attachments?: FileResponseInterface[];
}

export const TextMessage: React.FC<TextMessageProps> = React.memo(
  ({ content, role }) => {
    const { theme } = useTheme();
    const extensions = [
      theme === 'dark' ? githubDark : githubLight,
      EditorState.readOnly.of(true),
      EditorView.editable.of(false),
      javascript({ jsx: false, typescript: true }),
    ];

    return (
      <>
        <Markdown
          remarkPlugins={[remarkGfm]}
          className="bg-inherit"
          components={{
            code({ node, inline, className, children, ...props }: any) {
              if (role === 'user') {
                return <div className="font-mono text-sm">{children}</div>;
              }
              const match = /language-(\w+)/.exec(className || '');

              return !inline && match && match[1] ? (
                <div
                  className={cn(
                    'relative border rounded-md p-4 pt-12',
                    theme === 'dark' ? 'bg-[#0E1117]' : 'bg-background',
                  )}
                >
                  <ReactCodeMirror
                    value={String(children).trim()}
                    className="border-none"
                    width="100%"
                    minWidth="100%"
                    maxWidth="100%"
                    minHeight="50px"
                    basicSetup={{
                      syntaxHighlighting: true,
                      foldGutter: false,
                      lineNumbers: false,
                      searchKeymap: true,
                      lintKeymap: true,
                      autocompletion: false,
                      highlightActiveLine: false,
                      highlightActiveLineGutter: false,
                      highlightSpecialChars: false,
                      indentOnInput: false,
                      bracketMatching: false,
                      closeBrackets: false,
                    }}
                    lang={match[1]}
                    theme={theme === 'dark' ? githubDark : githubLight}
                    readOnly={true}
                    extensions={extensions}
                  />
                  <div className="absolute top-4 left-5 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <CodeIcon className="size-3" />
                      <span>{match[1]}</span>
                    </div>
                  </div>
                  <CopyCode
                    textToCopy={String(children).trim()}
                    className="absolute top-2 right-2 text-xs text-gray-500"
                  />
                </div>
              ) : (
                <code
                  className={cn(
                    className,
                    'bg-gray-200 px-[6px] py-[2px] rounded-xs font-mono text-sm',
                  )}
                  {...props}
                >
                  {String(children).trim()}
                </code>
              );
            },
          }}
        >
          {content}
        </Markdown>
        {role === 'bot' && (
          <CopyButton textToCopy={content} className="size-6 p-1 mt-2" />
        )}
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.content === nextProps.content &&
      prevProps.role === nextProps.role
    );
  },
);
TextMessage.displayName = 'TextMessage';

const CopyCode = ({
  textToCopy,
  className,
}: {
  textToCopy: string;
  className?: string;
}) => {
  const [isCopied, setIsCopied] = React.useState(false);
  return (
    <div className={className}>
      <Button
        variant="ghost"
        className="gap-2"
        size="xs"
        onClick={() => {
          setIsCopied(true);
          navigator.clipboard.writeText(textToCopy);
          setTimeout(() => setIsCopied(false), 1500);
        }}
      >
        <Copy className="size-4" />
        <span className="text-xs">{isCopied ? 'Copied!' : 'Copy Code'}</span>
      </Button>
    </div>
  );
};
