import { Static, Type } from '@sinclair/typebox';
import { Bot } from 'lucide-react';
import React, { forwardRef } from 'react';

import { CodeEditor } from '../step-settings/code-settings/code-editor';

import { WelcomeMessage } from './welcome-message';

export const CopilotMessage = Type.Union([
  Type.Object({
    messageType: Type.Literal('code'),
    userType: Type.Literal('bot'),
    content: Type.Object({
      packages: Type.Object({
        dependencies: Type.Record(Type.String(), Type.String()),
      }),
      code: Type.String(),
      inputs: Type.Record(Type.String(), Type.String()),
      title: Type.String(),
      icon: Type.String(),
    }),
  }),
  Type.Object({
    messageType: Type.Literal('text'),
    userType: Type.Union([Type.Literal('user'), Type.Literal('bot')]),
    content: Type.String(),
  }),
]);
export type CopilotMessage = Static<typeof CopilotMessage>;

const ChatBox = ({ children }: { children: React.ReactNode }) => (
  <div
    className={`flex max-w-xs lg:max-w-md bg-gray-100 dark:bg-gray-800 dark:text-gray-100 rounded-2xl pl-5 pr-5 pt-2 pb-2 break-words`}
  >
    {children}
  </div>
);

interface ChatMessageProps {
  message: CopilotMessage;
  onApplyCode: (message: CopilotMessage) => void;
}

export const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ message, onApplyCode }, ref) => {
    const isUser = message.userType === 'user';
    const isBot = message.userType === 'bot';
    const isCode = message.messageType === 'code';
    const isWelcome =
      message.messageType === 'text' && message.content === 'welcome';

    return (
      <div
        ref={ref}
        className={`flex gap-2 mx-2 ${
          isUser ? 'justify-end' : 'justify-start'
        }`}
      >
        {isWelcome ? (
          <WelcomeMessage message={message} />
        ) : (
          <>
            {isBot && (
              <>
                <div className="min-w-8 min-h-8 max-h-8 max-w-8 border rounded-full border-gray-300 dark:border-gray-600 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                </div>
                <div className={`w-full min-w-0`}>
                  {!isCode ? (
                    <ChatBox>
                      <p>{message.content}</p>
                    </ChatBox>
                  ) : (
                    <CodeEditor
                      minHeight="0px"
                      animateBorderColorToggle={false}
                      sourceCode={{
                        code: message.content.code,
                        packageJson: JSON.stringify(
                          message.content.packages,
                          null,
                          2,
                        ),
                      }}
                      readonly={true}
                      onChange={() => {}}
                      applyCodeToCurrentStep={() => onApplyCode(message)}
                    ></CodeEditor>
                  )}
                </div>
              </>
            )}
            {isUser && (
              <ChatBox>
                <p>{message.content}</p>
              </ChatBox>
            )}
          </>
        )}
      </div>
    );
  },
);

ChatMessage.displayName = 'ChatMessage';
