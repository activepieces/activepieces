import { BotIcon, CircleX, RotateCcw } from 'lucide-react';
import React from 'react';

import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from '@/components/ui/chat/chat-bubble';
import { ApErrorParams, ChatUIResponse, ErrorCode } from '@activepieces/shared';

const formatError = (
  projectId: string | undefined | null,
  flowId: string,
  error: ApErrorParams,
) => {
  switch (error.code) {
    case ErrorCode.NO_CHAT_RESPONSE:
      return projectId ? (
        <span>
          No response from the chatbot. Ensure that{' '}
          <strong>Respond on UI</strong> is in{' '}
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
      ) : (
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

interface ErrorBubbleProps {
  chatUI: ChatUIResponse | null | undefined;
  flowId: string;
  sendingError: ApErrorParams;
  sendMessage: (arg0: { isRetrying: boolean; message?: any }) => void;
}

export const ErrorBubble = ({
  chatUI,
  flowId,
  sendingError,
  sendMessage,
}: ErrorBubbleProps) => (
  <ChatBubble variant="received" className="pb-8">
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
);

ErrorBubble.displayName = 'ErrorBubble';
