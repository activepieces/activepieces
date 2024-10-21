import { useTheme } from '@/components/theme-provider';
import { Badge } from '@/components/ui/badge';
import { ChatBubble, ChatBubbleAction, ChatBubbleAvatar, ChatBubbleMessage } from '@/components/ui/chat/chat-bubble';
import { ChatMessageList } from '@/components/ui/chat/chat-message-list';
import { CopyButton } from '@/components/ui/copy-button';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import { cn } from '@/lib/utils';
import { ApErrorParams, ChatUIResponse, ErrorCode } from '@activepieces/shared';
import { javascript } from '@codemirror/lang-javascript';
import { Static, Type } from '@sinclair/typebox';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import ReactCodeMirror, { EditorState, EditorView } from '@uiw/react-codemirror';
import { BotIcon, CircleX, Download, RotateCcw } from 'lucide-react';
import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const Messages = Type.Array(
  Type.Object({
    role: Type.Union([Type.Literal('user'), Type.Literal('bot')]),
    content: Type.String(),
    type: Type.Optional(
      Type.Union([
        Type.Literal('text'),
        Type.Literal('image'),
        Type.Literal('file'),
      ]),
    ),
    mimeType: Type.Optional(Type.String()),
  }),
);
export type Messages = Static<typeof Messages>;

interface MessagesListProps {
  messagesRef: React.RefObject<HTMLDivElement>;
  messages: Messages;
  chatUI: ChatUIResponse | null | undefined;
  sendingError: ApErrorParams | null;
  isSending: boolean;
  flowId: string;
  sendMessage: (arg0: { isRetrying: boolean }) => void;
  setSelectedImage: (image: string | null) => void;
}

const formatError = (
  projectId: string | undefined | null,
  flowId: string,
  error: ApErrorParams,
) => {
  switch (error.code) {
    case ErrorCode.NO_CHAT_RESPONSE:
      if (projectId) {
        return (
          <span>
            No response from the chatbot. Ensure that{' '}
            <strong>Respond on UI (Markdown)</strong> is the final step in{' '}
            <a
              href={`/projects/${projectId}/flows/${flowId}`}
              className="text-primary underline"
              target="_blank"
              rel="noreferrer"
            >
              your flow
            </a>
            .
          </span>
        );
      }
      return (
        <span>
          The chatbot is not responding. It seems there might be an issue with
          how this chat was set up. Please contact the person who shared this
          chat link with you for assistance.
        </span>
      );
    case ErrorCode.FLOW_NOT_FOUND:
      return (
        <span>The chat flow you are trying to access no longer exists.</span>
      );
    case ErrorCode.VALIDATION:
      return <span>{`Validation error: ${error.params.message}`}</span>;
    default:
      return <span>Something went wrong. Please try again.</span>;
  }
};

export const MessagesList = React.memo(({
  messagesRef,
  messages,
  chatUI,
  sendingError,
  isSending,
  flowId,
  sendMessage,
  setSelectedImage
}: MessagesListProps) => {
  const { theme } = useTheme();
  const extensions = [
    theme === 'dark' ? githubDark : githubLight,
    EditorState.readOnly.of(true),
    EditorView.editable.of(false),
    javascript({ jsx: false, typescript: true }),
  ];

  return (
    <ChatMessageList ref={messagesRef}>
      {messages.map((message, index) => (
        <ChatBubble
          key={index}
          variant={message.role === 'user' ? 'sent' : 'received'}
          className="flex items-start"
        >
          {message.role === 'bot' && (
            <ChatBubbleAvatar
              src={chatUI?.platformLogoUrl}
              fallback={<BotIcon className="size-5" />}
            />
          )}
          <ChatBubbleMessage className="flex flex-col gap-2">
            {message.type === 'image' ? (
              <div className="relative group">
                <ImageWithFallback
                  src={message.content}
                  alt="Received image"
                  className="w-80 h-auto rounded-md cursor-pointer"
                  onClick={() => setSelectedImage(message.content)}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const link = document.createElement('a');
                    link.href = message.content;
                    link.download = 'image';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100"
                >
                  <Download className="h-4 w-4 text-white" />
                </button>
              </div>
            ) : message.type === 'file' ? (
              <Badge
                variant="secondary"
                className="cursor-pointer hover:bg-secondary/80"
                onClick={() => window.open(message.content, '_blank')}
              >
                <Download className="mr-2 h-4 w-4" /> Download File
              </Badge>
            ) : (
              <Markdown
                remarkPlugins={[remarkGfm]}
                className="bg-inherit"
                components={{

                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');

                    return !inline && match && match[1] ? (
                      <div className="relative">
                        <ReactCodeMirror
                          value={String(children).trim()}
                          className="border-none"
                          width="100%"
                          maxWidth="100%"
                          minHeight="50px"
                          basicSetup={{
                            syntaxHighlighting: true,
                            foldGutter: false,
                            lineNumbers: true,
                            searchKeymap: true,
                            lintKeymap: true,
                            autocompletion: true,
                            highlightActiveLine: true,
                            highlightActiveLineGutter: true,
                            highlightSpecialChars: true,
                            indentOnInput: true,
                            bracketMatching: true,
                            closeBrackets: true,
                          }}
                          lang={match[1]}
                          theme={theme === "dark" ? githubDark : githubLight}
                          readOnly={true}
                          extensions={extensions}
                        />
                        <CopyButton
                          textToCopy={String(children).trim()}
                          className="absolute top-2 right-2 size-6 p-1"
                        />
                      </div>
                    ) : (
                      <code className={cn(className, "bg-gray-200 px-[6px] py-[2px] rounded-xs font-mono text-sm")} {...props}>
                        {String(children).trim()}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </Markdown>
            )}
            {message.role === 'bot' && message.type === 'text' && (
              <CopyButton
                textToCopy={message.content}
                className="size-6 p-1 mt-2"
              />
            )}
          </ChatBubbleMessage>
        </ChatBubble>
      ))}
      {sendingError && !isSending && (
        <ChatBubble variant="received">
          <div className="relative">
            <ChatBubbleAvatar
              src={chatUI?.platformLogoUrl}
              fallback={<BotIcon className="size-5" />}
            />
            <div className="absolute -bottom-[2px] -right-[2px]">
              <CircleX className="size-4 text-destructive" strokeWidth={3} />
            </div>
          </div>
          <ChatBubbleMessage className="text-destructive">
            {formatError(chatUI?.projectId, flowId, sendingError)}
          </ChatBubbleMessage>
          <div className="flex gap-1">
            <ChatBubbleAction
              variant="outline"
              className="size-5 mt-2"
              icon={<RotateCcw className="size-3" />}
              onClick={() => {
                sendMessage({ isRetrying: true });
              }}
            />
          </div>
        </ChatBubble>
      )}
      {isSending && (
        <ChatBubble variant="received">
          <ChatBubbleAvatar
            src={chatUI?.platformLogoUrl}
            fallback={<BotIcon className="size-5" />}
          />
          <ChatBubbleMessage isLoading />
        </ChatBubble>
      )}
    </ChatMessageList>
  );
});
