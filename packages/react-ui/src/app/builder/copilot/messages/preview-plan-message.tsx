import { DashIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { Check, Undo2, X } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  ChatBubble,
  ChatBubbleMessage,
} from '@/components/ui/chat/chat-bubble';
import { LoadingSpinner } from '@/components/ui/spinner';

import { CopilotAvatar } from '../copilot-avatar';
import { CopilotStepStatus, FlowPlanMessageContent } from '../types';

type PreviewPlanMessageProps = {
  message: FlowPlanMessageContent;
};

const StatusIcon = ({ status }: { status: CopilotStepStatus }) => {
  switch (status) {
    case CopilotStepStatus.SUCCESS:
      return <Check className="h-4 w-4 text-green-500" />;
    case CopilotStepStatus.ERROR:
      return <X className="h-4 w-4 text-red-500" />;
    case CopilotStepStatus.RUNNING:
      return <LoadingSpinner className="h-4 w-4" />;
    case CopilotStepStatus.PENDING:
      return <DashIcon className="h-4 w-4 text-gray-500" />;
  }
};

export const PreviewPlanMessage: React.FC<PreviewPlanMessageProps> = ({
  message,
}) => {
  const { steps } = message.content;

  return (
    <ChatBubble variant="received">
      <CopilotAvatar />
      <ChatBubbleMessage variant="received" className="w-full">
        <div className="rounded bg-muted/50 p-4 relative">
          <div className="flex items-center justify-between pb-2">
            {t('Here is the plan for your flow')}
            <Button variant="outline" className="gap-2" size="sm">
              {t('Restore')}
              <Undo2 className="h-4 w-4"></Undo2>
            </Button>
          </div>
          <div className="space-y-4">
            <ul className="space-y-3">
              {steps.map((step, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <div className="flex-shrink-0">
                    <StatusIcon status={step.status} />
                  </div>
                  <span>{step.title}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-end"></div>
        </div>
      </ChatBubbleMessage>
    </ChatBubble>
  );
};
