import * as React from 'react';
import { Check, X } from 'lucide-react';
import { CopilotStepStatus, FlowPlanMessageContent } from '../types';
import { ChatBubble, ChatBubbleMessage } from '@/components/ui/chat/chat-bubble';
import { CopilotAvatar } from '../copilot-avatar';
import { LoadingSpinner } from '@/components/ui/spinner';

type PreviewPlanMessageProps = {
    message: FlowPlanMessageContent
}

export const PreviewPlanMessage: React.FC<PreviewPlanMessageProps> = ({
    message
}) => {
    const { steps } = message.content;

    const getStatusIcon = (status: CopilotStepStatus) => {
        switch (status) {
            case CopilotStepStatus.SUCCESS:
                return <Check className="h-4 w-4 text-green-500" />;
            case CopilotStepStatus.ERROR:
                return <X className="h-4 w-4 text-red-500" />;
            case CopilotStepStatus.PENDING:
                return <LoadingSpinner className='h-4 w-4' />;
        }
    };

    return (
        <ChatBubble variant="received">
            <CopilotAvatar />
            <ChatBubbleMessage variant="received" className='w-full'>
                <div className="rounded bg-muted/50 p-4 relative">
                    <div className="flex items-center justify-between pb-2">
                        Here is the plan for your flow
                    </div>
                    <div className="space-y-4">
                        <ul className="space-y-3">
                            {steps.map((step, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm">
                                    <div className="flex-shrink-0">
                                        {getStatusIcon(step.status)}
                                    </div>
                                    <span>
                                        {step.title}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </ChatBubbleMessage>
        </ChatBubble>
    );
};
