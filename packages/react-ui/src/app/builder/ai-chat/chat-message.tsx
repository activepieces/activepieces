import { Bot } from 'lucide-react';
import React from 'react';

import { CodeEditior } from '../step-settings/code-settings/code-editior';

interface ChatMessageProps {
  message: string;
  userType: string;
  isFirstPrompt: boolean;
}

export const ChatMessage = React.forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ message, userType, isFirstPrompt }, ref) => {
    const sourceCode = {
      code: message,
      packageJson: '',
    };

    return (
      <div
        className={`flex ${
          userType === 'user' ? 'justify-end' : 'justify-start'
        } m-4`}
        ref={ref}
      >
        {userType === 'bot' && (
          <>
            <div className="w-7 h-7 border rounded-full border-gray-300 dark:border-gray-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div className={`w-full pl-7 pr-7 mb-6`}>
              {isFirstPrompt ? (
                <ChatBox>
                  <p>{message}</p>
                </ChatBox>
              ) : (
                <CodeEditior
                  sourceCode={sourceCode}
                  readonly={true}
                  onChange={() => {}}
                  skipLineNumbers={true}
                  applyButton={true}
                ></CodeEditior>
              )}
            </div>
          </>
        )}
        {userType === 'user' && (
          <ChatBox>
            <p>{message}</p>
          </ChatBox>
        )}
      </div>
    );
  },
);

const ChatBox = ({ children }: { children: React.ReactNode }) => (
  <div
    className={`flex max-w-xs lg:max-w-md bg-gray-100 dark:bg-gray-800 dark:text-gray-100 rounded-2xl pl-5 pr-5 pt-2 pb-2 break-word`}
  >
    {children}
  </div>
);

ChatMessage.displayName = 'ChatMessage';
