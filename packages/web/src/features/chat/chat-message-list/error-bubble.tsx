import { ApErrorParams, ErrorCode } from '@activepieces/core-utils';
import { ChatUIResponse } from '@activepieces/shared';
import {
  CancelCircleIcon,
  Robot01Icon,
  RotateCcwIcon,
} from '@hugeicons/core-free-icons';
import React from 'react';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';

import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from '../chat-bubble';

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
            className="text-accent-11 underline"
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
    case ErrorCode.ENTITY_NOT_FOUND:
      if (error.params.entityType === 'flow') {
        return (
          <span>The chat flow you are trying to access no longer exists.</span>
        );
      }
      return <span>Something went wrong. Please try again.</span>;
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
        fallback={<HugeiconsIcon icon={Robot01Icon} className="size-5" />}
      />
      <div className="absolute -bottom-[2px] -right-[2px]">
        <HugeiconsIcon
          icon={CancelCircleIcon}
          className="size-4 text-danger-11"
          strokeWidth={3}
        />
      </div>
    </div>
    <ChatBubbleMessage className="text-danger-11">
      {formatError(chatUI?.projectId, flowId, sendingError)}
    </ChatBubbleMessage>
    <div className="flex gap-1">
      <ChatBubbleAction
        variant="outline"
        className="size-5 mt-2"
        icon={<HugeiconsIcon icon={RotateCcwIcon} className="size-3" />}
        onClick={() => {
          sendMessage({ isRetrying: true });
        }}
      />
    </div>
  </ChatBubble>
);

ErrorBubble.displayName = 'ErrorBubble';
